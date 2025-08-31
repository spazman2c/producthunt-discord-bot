import { GraphQLClient } from 'graphql-request';
import { getConfig } from './config/lazy';

async function debugProductHuntAPI() {
  try {
    const cfg = getConfig();
    console.log('🔍 Debugging Product Hunt API Connection...');
    console.log('API URL:', cfg.productHunt.apiUrl);
    console.log('Token length:', cfg.productHunt.token?.length || 0);
    console.log('Token starts with:', cfg.productHunt.token?.substring(0, 10) + '...');

    const client = new GraphQLClient(cfg.productHunt.apiUrl, {
      headers: {
        Authorization: `Bearer ${cfg.productHunt.token}`,
        'Content-Type': 'application/json',
      },
    });

    // Test with a simple query first
    console.log('\n📡 Testing simple query...');
    const simpleQuery = `
      query {
        viewer {
          id
          name
        }
      }
    `;

    try {
      const simpleResult = await client.request(simpleQuery);
      console.log('✅ Simple query successful:', JSON.stringify(simpleResult, null, 2));
    } catch (error) {
      console.log('❌ Simple query failed:', error);
    }

    // Test the posts query
    console.log('\n📡 Testing posts query...');
    const postsQuery = `
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

    const variables = { first: 1 };

    try {
      const result = await client.request(postsQuery, variables);
      console.log('✅ Posts query successful');
      console.log('Response structure:', {
        hasData: !!(result as any).data,
        dataKeys: (result as any).data ? Object.keys((result as any).data) : [],
        hasPosts: (result as any).data && !!(result as any).data.posts,
        postsKeys: (result as any).data?.posts ? Object.keys((result as any).data.posts) : [],
        postsEdgesLength: (result as any).data?.posts?.edges?.length || 0,
      });
      console.log('Full response:', JSON.stringify(result, null, 2));
    } catch (error) {
      console.log('❌ Posts query failed:', error);
      
      // Try to get more details about the error
      if (error instanceof Error) {
        console.log('Error message:', error.message);
        console.log('Error stack:', error.stack);
      }
    }

    // Test with different query structure
    console.log('\n📡 Testing alternative query structure...');
    const altQuery = `
      query {
        posts(first: 1) {
          edges {
            node {
              id
              name
            }
          }
        }
      }
    `;

    try {
      const altResult = await client.request(altQuery);
      console.log('✅ Alternative query successful:', JSON.stringify(altResult, null, 2));
    } catch (error) {
      console.log('❌ Alternative query failed:', error);
    }

  } catch (error) {
    console.error('💥 Debug script failed:', error);
  }
}

debugProductHuntAPI();
