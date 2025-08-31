import { GraphQLClient } from 'graphql-request';
import { getConfig } from './config/lazy';

async function testSimpleAPI() {
  try {
    const cfg = getConfig();
    console.log('🔍 Testing Product Hunt API with simple query...');
    console.log('API URL:', cfg.productHunt.apiUrl);
    console.log('Token length:', cfg.productHunt.token?.length || 0);

    const client = new GraphQLClient(cfg.productHunt.apiUrl, {
      headers: {
        Authorization: `Bearer ${cfg.productHunt.token}`,
        'Content-Type': 'application/json',
      },
    });

    // Test with the simplest possible query
    const simpleQuery = `
      query {
        viewer {
          id
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
      } else {
        console.log('❌ No data property found');
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

  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

testSimpleAPI();
