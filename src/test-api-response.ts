import { GraphQLClient } from 'graphql-request';

async function testAPIResponse() {
  // Test with different API URLs
  const apiUrls = [
    'https://api.producthunt.com/v2/api/graphql',
    'https://api.producthunt.com/v2/graphql',
    'https://api.producthunt.com/graphql',
  ];

  const token = process.env.PH_TOKEN;
  if (!token) {
    console.log('❌ No PH_TOKEN found in environment variables');
    return;
  }

  console.log('🔍 Testing Product Hunt API responses...');
  console.log('Token length:', token.length);
  console.log('Token starts with:', token.substring(0, 10) + '...');

  for (const apiUrl of apiUrls) {
    console.log(`\n📡 Testing API URL: ${apiUrl}`);
    
    try {
      const client = new GraphQLClient(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Simple query to test
      const query = `
        query {
          viewer {
            id
            name
          }
        }
      `;

      const result = await client.request(query);
      console.log('✅ Success! Response structure:');
      console.log('Response type:', typeof result);
      console.log('Response keys:', Object.keys(result as any));
      console.log('Full response:', JSON.stringify(result, null, 2));
      
      // If this works, try the posts query
      console.log('\n📡 Testing posts query...');
      const postsQuery = `
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

      const postsResult = await client.request(postsQuery);
      console.log('✅ Posts query successful!');
      console.log('Posts response:', JSON.stringify(postsResult, null, 2));
      
      return; // Found working API URL
      
    } catch (error) {
      console.log('❌ Failed:', error);
      if (error instanceof Error) {
        console.log('Error message:', error.message);
        console.log('Error stack:', error.stack);
      }
    }
  }
  
  console.log('\n💥 All API URLs failed');
}

testAPIResponse().catch(console.error);
