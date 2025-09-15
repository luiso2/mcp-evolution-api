import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Test connection to Evolution API
async function testEvolutionConnection() {
  const evolutionUrl = process.env.EVOLUTION_API_URL || 'https://evolution-api-evolution-api.dqyvuv.easypanel.host';
  const apiKey = process.env.EVOLUTION_API_KEY;
  
  console.log('🔍 Testing connection to Evolution API...');
  console.log('URL:', evolutionUrl);
  console.log('API Key:', apiKey ? `${apiKey.substring(0, 8)}...` : 'Not set');
  
  try {
    const response = await axios.get(evolutionUrl, {
      timeout: 10000
    });
    
    console.log('✅ Connection successful!');
    console.log('Status:', response.status);
    console.log('Response:', response.data);
    
    // Test instance endpoint
    console.log('\n🔍 Testing instances endpoint...');
    try {
      const instancesResponse = await axios.get(`${evolutionUrl}/instance/fetchInstances`, {
        headers: {
          'apikey': apiKey || ''
        },
        timeout: 10000
      });
      console.log('✅ Instances endpoint accessible!');
      console.log('Instances:', instancesResponse.data);
    } catch (instanceError) {
      console.log('⚠️ Instances endpoint error (might need API key):', instanceError.response?.status, instanceError.response?.data || instanceError.message);
    }
    
  } catch (error) {
    console.log('❌ Connection failed!');
    console.log('Error:', error.response?.status, error.response?.data || error.message);
  }
}

testEvolutionConnection();