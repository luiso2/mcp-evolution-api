import axios from 'axios';

// Simular un webhook externo que envía datos a nuestro servidor local
const testWebhook = async () => {
  console.log('🚀 Iniciando prueba de webhook externo...');
  console.log('📡 Simulando solicitud desde un servicio externo');
  
  const webhookData = [
    {
      "headers": {
        "host": "evolution-api.example.com",
        "user-agent": "Evolution-API/1.0",
        "content-type": "application/json",
        "x-forwarded-for": "192.168.1.100",
        "x-real-ip": "192.168.1.100"
      },
      "params": {},
      "query": {},
      "body": {
        "event": "messages.upsert",
        "instance": "TestInstance",
        "data": {
          "key": {
            "remoteJid": "5511999887766@s.whatsapp.net",
            "fromMe": false,
            "id": "TEST123456789"
          },
          "pushName": "Usuario Test",
          "status": "DELIVERY_ACK",
          "message": {
            "conversation": "/status"
          },
          "messageType": "conversation",
          "messageTimestamp": Math.floor(Date.now() / 1000),
          "instanceId": "test-instance-id",
          "source": "webhook-test"
        },
        "destination": "http://localhost:3000/api/webhook",
        "date_time": new Date().toISOString(),
        "sender": "5511999887766@s.whatsapp.net",
        "server_url": "http://localhost:3000",
        "apikey": "TEST-API-KEY-123"
      }
    }
  ];

  try {
    console.log('📤 Enviando webhook con datos:');
    console.log(JSON.stringify(webhookData, null, 2));
    console.log('\n' + '='.repeat(50));
    
    const response = await axios.post('http://localhost:3000/api/webhook', webhookData, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'External-Webhook-Test/1.0'
      },
      timeout: 10000
    });
    
    console.log('✅ Respuesta del servidor:');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    console.log('Headers:', response.headers);
    
  } catch (error) {
    console.error('❌ Error al enviar webhook:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
};

// Ejecutar múltiples pruebas
const runTests = async () => {
  console.log('🔄 Ejecutando pruebas de webhook...');
  
  // Prueba 1: Comando /status
  console.log('\n📋 PRUEBA 1: Comando /status');
  await testWebhook();
  
  // Esperar un poco entre pruebas
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Prueba 2: Saludo
  console.log('\n📋 PRUEBA 2: Mensaje de saludo');
  const webhookData2 = [
    {
      "body": {
        "event": "messages.upsert",
        "instance": "TestInstance",
        "data": {
          "key": {
            "remoteJid": "5511999887766@s.whatsapp.net",
            "fromMe": false,
            "id": "TEST987654321"
          },
          "pushName": "Usuario Test",
          "message": {
            "conversation": "Hola bot"
          },
          "messageType": "conversation",
          "messageTimestamp": Math.floor(Date.now() / 1000)
        },
        "sender": "5511999887766@s.whatsapp.net"
      }
    }
  ];
  
  try {
    const response = await axios.post('http://localhost:3000/api/webhook', webhookData2);
    console.log('✅ Respuesta:', response.status, response.data);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  console.log('\n🏁 Pruebas completadas');
};

runTests();