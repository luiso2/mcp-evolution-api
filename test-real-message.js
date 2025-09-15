import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testRealMessage() {
  const evolutionUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;
  
  console.log('📱 Testing real message sending...');
  console.log('URL:', evolutionUrl);
  console.log('API Key:', apiKey ? `${apiKey.substring(0, 8)}...` : 'Not set');
  
  try {
    // Send a test message to the Luis2 instance
    const response = await axios.post(
      `${evolutionUrl}/message/sendText/Luis2`,
      {
        number: '554197034153', // The owner number from the instance info
        text: 'Hola! Este es un mensaje de prueba desde el servidor MCP. 🤖'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey
        },
        timeout: 10000
      }
    );
    
    console.log('✅ Message sent successfully!');
    console.log('Status:', response.status);
    console.log('Response:', response.data);
    
  } catch (error) {
    console.log('❌ Error sending message:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }
}

testRealMessage();