import { GraphQLClient } from 'graphql-request';

async function testTokenOnly() {
  const token = "KUjSvrC6QhddqSE97wLY0ReHqbT3hdDjmfIXUEW9khM";
  const apiUrl = "https://api.producthunt.com/v2/api/graphql";
  
  console.log('🔍 Testing Product Hunt API with your token...');
  console.log('API URL:', apiUrl);
  console.log('Token length:', token.length);
  console.log('Token starts with:', token.substring(0, 10) + '...');

  const client = new GraphQLClient(apiUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  // Test with the posts query that the bot uses
  const simpleQuery = `
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

  console.log('\n📡 Sending query:', simpleQuery);

  try {
    const result = await client.request(simpleQuery);
    console.log('✅ SUCCESS! Raw response:');
    console.log('Type:', typeof result);
    console.log('Keys:', Object.keys(result as any));
    console.log('Full response:', JSON.stringify(result, null, 2));
    
    if ((result as any).data) {
      console.log('✅ Has data property:', !!(result as any).data);
      console.log('Data keys:', Object.keys((result as any).data));
      console.log('✅ Token is working correctly!');
    } else {
      console.log('❌ No data property found');
      console.log('❌ Token might be invalid or expired');
    }
    
  } catch (error) {
    console.log('❌ Query failed:');
    console.log('Error type:', typeof error);
    console.log('Error message:', (error as any).message);
    
    if ((error as any).response) {
      console.log('Response status:', (error as any).response.status);
      console.log('Response data:', JSON.stringify((error as any).response, null, 2));
    }
    
    if ((error as any).request) {
      console.log('Request details:', JSON.stringify((error as any).request, null, 2));
    }
  }
}

testTokenOnly();
