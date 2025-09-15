import axios from 'axios';

// URL pública del túnel
const TUNNEL_URL = 'https://green-crews-punch.loca.lt/api/webhook';

async function testPublicWebhook() {
  console.log('🌐 Probando webhook público:', TUNNEL_URL);
  
  const testData = {
    event: 'messages.upsert',
    instance: 'test-instance',
    data: {
      key: {
        remoteJid: '5511999999999@s.whatsapp.net',
        fromMe: false,
        id: 'test-message-id'
      },
      message: {
        conversation: '/status'
      },
      messageTimestamp: Math.floor(Date.now() / 1000),
      pushName: 'Test User'
    }
  };

  try {
    console.log('📤 Enviando datos de prueba...');
    
    const response = await axios.post(TUNNEL_URL, testData, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Evolution-API-Test'
      },
      timeout: 10000
    });
    
    console.log('✅ Respuesta exitosa:');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    
  } catch (error) {
    console.error('❌ Error en la prueba:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Ejecutar prueba
testPublicWebhook();