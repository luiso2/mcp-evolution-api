import axios from 'axios';

async function testWebhookEndpoint() {
  console.log('🔄 Ejecutando pruebas completas de webhook...');
  console.log('=' .repeat(60));

  const tests = [
    {
      name: 'Comando /status',
      data: {
        "event": "messages.upsert",
        "instance": "TestInstance",
        "data": {
          "key": {
            "remoteJid": "5511999887766@s.whatsapp.net",
            "fromMe": false,
            "id": "TEST_STATUS_" + Date.now()
          },
          "pushName": "Usuario Test",
          "message": {
            "conversation": "/status"
          },
          "messageType": "conversation",
          "messageTimestamp": Math.floor(Date.now() / 1000)
        }
      }
    },
    {
      name: 'Comando /help',
      data: {
        "event": "messages.upsert",
        "instance": "TestInstance",
        "data": {
          "key": {
            "remoteJid": "5511999887766@s.whatsapp.net",
            "fromMe": false,
            "id": "TEST_HELP_" + Date.now()
          },
          "pushName": "Usuario Test",
          "message": {
            "conversation": "/help"
          },
          "messageType": "conversation",
          "messageTimestamp": Math.floor(Date.now() / 1000)
        }
      }
    },
    {
      name: 'Mensaje con saludo',
      data: {
        "event": "messages.upsert",
        "instance": "TestInstance",
        "data": {
          "key": {
            "remoteJid": "5511999887766@s.whatsapp.net",
            "fromMe": false,
            "id": "TEST_HELLO_" + Date.now()
          },
          "pushName": "Usuario Test",
          "message": {
            "conversation": "Hola bot"
          },
          "messageType": "conversation",
          "messageTimestamp": Math.floor(Date.now() / 1000)
        }
      }
    },
    {
      name: 'Mensaje normal sin comando',
      data: {
        "event": "messages.upsert",
        "instance": "TestInstance",
        "data": {
          "key": {
            "remoteJid": "5511999887766@s.whatsapp.net",
            "fromMe": false,
            "id": "TEST_NORMAL_" + Date.now()
          },
          "pushName": "Usuario Test",
          "message": {
            "conversation": "Este es un mensaje normal"
          },
          "messageType": "conversation",
          "messageTimestamp": Math.floor(Date.now() / 1000)
        }
      }
    }
  ];

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`\n📋 PRUEBA ${i + 1}: ${test.name}`);
    console.log('-'.repeat(40));
    
    try {
      console.log('📤 Enviando:', JSON.stringify(test.data, null, 2));
      
      const response = await axios.post('http://localhost:3000/api/webhook', test.data, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Webhook-Test/1.0'
        },
        timeout: 10000
      });
      
      console.log('✅ Respuesta exitosa:');
      console.log('   Status:', response.status);
      console.log('   Data:', JSON.stringify(response.data, null, 2));
      
      // Esperar un poco entre pruebas para ver los logs
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.log('❌ Error en la prueba:');
      console.log('   Message:', error.message);
      if (error.response) {
        console.log('   Status:', error.response.status);
        console.log('   Data:', error.response.data);
      }
    }
  }
  
  console.log('\n🏁 Todas las pruebas completadas');
  console.log('=' .repeat(60));
}

testWebhookEndpoint();