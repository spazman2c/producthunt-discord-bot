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
    logger.info('Initializing Product Hunt API client', {
      apiUrl: config.productHunt.apiUrl,
      tokenLength: config.productHunt.token?.length || 0,
    });
    
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
    // Try multiple query variations to handle different API versions
    const queries = [
      // Query 1: Standard GraphQL with RANKING order
      `
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
      `,
      // Query 2: Simple posts query without order
      `
        query TopToday($first: Int!) {
          posts(first: $first) {
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
      `,
      // Query 3: Direct posts query
      `
        query {
          posts(first: ${limit}) {
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
      `
    ];

    const variables = { first: limit };
    let lastError: Error | null = null;

    // Try each query variation until one works
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i]!; // Non-null assertion since we know queries array has elements
      const useVariables = i < 2 ? variables : undefined; // Only first 2 queries use variables

      try {
        logger.debug(`Trying Product Hunt API query variation ${i + 1}`, { limit });

        const response = await retry(
          async () => {
            const result = await this.client.request<
              ProductHuntGraphQLResponse<ProductHuntPostsResponse>
            >(query, useVariables || {});

            // Log the raw result for debugging
            logger.debug('Product Hunt API raw result:', {
              queryVariation: i + 1,
              resultType: typeof result,
              resultKeys: Object.keys(result),
              resultString: JSON.stringify(result, null, 2),
            });

            // Debug: Log the raw response
            logger.debug('Product Hunt API raw response:', {
              queryVariation: i + 1,
              hasErrors: !!result.errors,
              errorCount: result.errors?.length || 0,
              hasData: !!result.data,
              responseKeys: Object.keys(result),
              fullResponse: JSON.stringify(result, null, 2),
            });

            // Check for GraphQL errors
            if (result.errors && result.errors.length > 0) {
              const errorMessages = result.errors.map((e) => e.message).join(', ');
              logger.error('Product Hunt GraphQL errors:', result.errors);
              throw new Error(`GraphQL errors: ${errorMessages}`);
            }

            // Check if the result is an error response (like 401, 403, etc.)
            if ((result as any).message || (result as any).error || (result as any).status) {
              logger.error('Product Hunt API error response:', result);
              throw new Error(`API error: ${(result as any).message || (result as any).error || 'Unknown error'}`);
            }

            return result;
          },
          {
            retries: 2, // Fewer retries per query variation
            factor: 2,
            minTimeout: 1000,
            maxTimeout: 5000,
          }
        );

              // Debug: Log the response structure
        logger.debug('Product Hunt API response structure:', {
          queryVariation: i + 1,
          hasData: !!response.data,
          dataKeys: response.data ? Object.keys(response.data) : [],
          hasPosts: response.data && !!response.data.posts,
          postsKeys: response.data?.posts ? Object.keys(response.data.posts) : [],
        });

        // Validate response structure
        if (!response.data) {
          throw new Error('Product Hunt API response missing data property');
        }

        if (!response.data.posts) {
          throw new Error('Product Hunt API response missing posts property');
        }

        if (!response.data.posts.edges) {
          throw new Error('Product Hunt API response missing posts.edges property');
        }

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
          queryVariation: i + 1,
          count: posts.length,
          posts: posts.map((p) => ({ name: p.name, votes: p.votes, rank: p.rank })),
        });

        return {
          posts,
          totalCount: posts.length,
          hasNextPage: posts.length === limit,
        };

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.warn(`Product Hunt API query variation ${i + 1} failed:`, lastError.message);
        
        // If this is the last query variation, throw the error
        if (i === queries.length - 1) {
          logger.error('All Product Hunt API query variations failed', {
            error: lastError.message,
            limit,
          });
          throw lastError;
        }
        
        // Otherwise, continue to the next query variation
        continue;
      }
    }
    
    // This should never be reached, but TypeScript requires it
    throw new Error('All query variations failed');
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
