import { GraphQLClient } from 'graphql-request';
import { retry } from '../utils/retry';
import { config } from '../config';
import { logger } from '../utils/logger';
import {
  ProductHuntGraphQLResponse,
  ProductHuntPostsResponse,
  TopPostsResult,
} from '../types/producthunt';

export class ProductHuntAPI {
  private client: GraphQLClient;

  constructor() {
    this.client = new GraphQLClient(config.productHunt.apiUrl, {
      headers: {
        Authorization: `Bearer ${config.productHunt.token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Fetch the top posts from Product Hunt
   * @param limit Number of posts to fetch (default: 5)
   * @returns Promise<TopPostsResult>
   */
  async fetchTopPosts(limit: number = 5): Promise<TopPostsResult> {
    const query = `
      query TopToday($first: Int!) {
        posts(order: RANKING, first: $first) {
          edges {
            node {
              id
              name
              tagline
              slug
              votesCount
              url
              thumbnail {
                url
              }
            }
          }
        }
      }
    `;

    const variables = { first: limit };

    try {
      logger.debug('Fetching top posts from Product Hunt', { limit });

      const response = await retry(
        async () => {
          const result = await this.client.request<
            ProductHuntGraphQLResponse<ProductHuntPostsResponse>
          >(query, variables);

          // Check for GraphQL errors
          if (result.errors && result.errors.length > 0) {
            const errorMessages = result.errors.map((e) => e.message).join(', ');
            throw new Error(`GraphQL errors: ${errorMessages}`);
          }

          return result;
        },
        {
          retries: 3,
          factor: 2,
          minTimeout: 1000,
          maxTimeout: 10000,
        }
      );

      const posts = response.data.posts.edges.map((edge, index) => ({
        id: edge.node.id,
        name: edge.node.name,
        tagline: edge.node.tagline,
        slug: edge.node.slug,
        votes: edge.node.votesCount,
        url: edge.node.url,
        thumbnail: edge.node.thumbnail?.url,
        rank: index + 1,
      }));

      logger.info('Successfully fetched top posts', {
        count: posts.length,
        posts: posts.map((p) => ({ name: p.name, votes: p.votes, rank: p.rank })),
      });

      return {
        posts,
        totalCount: posts.length,
        hasNextPage: posts.length === limit,
      };
    } catch (error) {
      logger.error('Failed to fetch top posts from Product Hunt', {
        error: error instanceof Error ? error.message : String(error),
        limit,
      });
      throw error;
    }
  }

  /**
   * Test the API connection and authentication
   * @returns Promise<boolean>
   */
  async testConnection(): Promise<boolean> {
    try {
      logger.info('Testing Product Hunt API connection...');

      const result = await this.fetchTopPosts(1);

      if (result.posts.length > 0) {
        logger.info('Product Hunt API connection successful');
        return true;
      } else {
        logger.warn('Product Hunt API connection successful but no posts returned');
        return false;
      }
    } catch (error) {
      logger.error('Product Hunt API connection failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Get rate limit information from response headers
   * Note: Product Hunt API may not always provide rate limit headers
   */
  private getRateLimitInfo(headers: globalThis.Headers): {
    remaining?: number | undefined;
    reset?: number | undefined;
    limit?: number | undefined;
  } {
    return {
      remaining: headers.get('X-RateLimit-Remaining')
        ? parseInt(headers.get('X-RateLimit-Remaining')!, 10)
        : undefined,
      reset: headers.get('X-RateLimit-Reset')
        ? parseInt(headers.get('X-RateLimit-Reset')!, 10)
        : undefined,
      limit: headers.get('X-RateLimit-Limit')
        ? parseInt(headers.get('X-RateLimit-Limit')!, 10)
        : undefined,
    };
  }
}
