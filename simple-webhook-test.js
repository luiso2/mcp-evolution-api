import axios from 'axios';

async function testWebhook() {
  console.log('🚀 Probando webhook simple...');
  
  const webhookData = {
    "event": "messages.upsert",
    "instance": "TestInstance",
    "data": {
      "key": {
        "remoteJid": "5511999887766@s.whatsapp.net",
        "fromMe": false,
        "id": "TEST123456789"
      },
      "pushName": "Usuario Test",
      "message": {
        "conversation": "/status"
      },
      "messageType": "conversation",
      "messageTimestamp": Math.floor(Date.now() / 1000)
    }
  };

  try {
    console.log('📤 Enviando datos:', JSON.stringify(webhookData, null, 2));
    
    const response = await axios.post('http://localhost:3000/api/webhook', webhookData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    
    console.log('✅ Respuesta exitosa:');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    }
  }
}

testWebhook();