import axios from 'axios';

// Simulación de un túnel externo enviando webhooks
async function simulateExternalTunnel() {
  console.log('🌐 SIMULACIÓN DE TÚNEL EXTERNO');
  console.log('=' .repeat(60));
  console.log('📡 Simulando webhooks desde un servicio externo...');
  console.log('🔗 Como si fuera: https://abc123.ngrok.io -> localhost:3000');
  console.log('');

  const externalWebhooks = [
    {
      name: 'Webhook desde Evolution API externa',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Evolution-API/2.1.0',
        'X-Forwarded-For': '203.0.113.45',
        'X-Real-IP': '203.0.113.45',
        'Host': 'abc123.ngrok.io'
      },
      data: {
        "event": "messages.upsert",
        "instance": "ProductionBot",
        "data": {
          "key": {
            "remoteJid": "5511987654321@s.whatsapp.net",
            "fromMe": false,
            "id": "EXTERNAL_MSG_" + Date.now()
          },
          "pushName": "Cliente Externo",
          "message": {
            "conversation": "/status"
          },
          "messageType": "conversation",
          "messageTimestamp": Math.floor(Date.now() / 1000),
          "source": "external-evolution-api"
        }
      }
    },
    {
      name: 'Webhook con comando de ayuda',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'WhatsApp-Webhook/1.0',
        'X-Forwarded-For': '198.51.100.23',
        'X-Real-IP': '198.51.100.23',
        'Host': 'xyz789.localtunnel.me'
      },
      data: {
        "event": "messages.upsert",
        "instance": "SupportBot",
        "data": {
          "key": {
            "remoteJid": "5511123456789@s.whatsapp.net",
            "fromMe": false,
            "id": "HELP_REQUEST_" + Date.now()
          },
          "pushName": "Usuario Soporte",
          "message": {
            "conversation": "/help"
          },
          "messageType": "conversation",
          "messageTimestamp": Math.floor(Date.now() / 1000),
          "source": "external-support-system"
        }
      }
    },
    {
      name: 'Webhook con mensaje de saludo',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ChatBot-Service/3.2.1',
        'X-Forwarded-For': '192.0.2.100',
        'X-Real-IP': '192.0.2.100',
        'Host': 'tunnel.serveo.net'
      },
      data: {
        "event": "messages.upsert",
        "instance": "ChatBot",
        "data": {
          "key": {
            "remoteJid": "5511555666777@s.whatsapp.net",
            "fromMe": false,
            "id": "GREETING_" + Date.now()
          },
          "pushName": "Nuevo Usuario",
          "message": {
            "conversation": "Hola! ¿Cómo estás?"
          },
          "messageType": "conversation",
          "messageTimestamp": Math.floor(Date.now() / 1000),
          "source": "external-chatbot"
        }
      }
    }
  ];

  for (let i = 0; i < externalWebhooks.length; i++) {
    const webhook = externalWebhooks[i];
    console.log(`\n🚀 WEBHOOK ${i + 1}: ${webhook.name}`);
    console.log('-'.repeat(50));
    
    try {
      console.log('📡 Headers simulados:');
      Object.entries(webhook.headers).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });
      
      console.log('\n📤 Payload:');
      console.log(JSON.stringify(webhook.data, null, 2));
      
      const startTime = Date.now();
      const response = await axios.post('http://localhost:3000/api/webhook', webhook.data, {
        headers: webhook.headers,
        timeout: 15000
      });
      const responseTime = Date.now() - startTime;
      
      console.log('\n✅ RESPUESTA EXITOSA:');
      console.log(`   ⏱️  Tiempo de respuesta: ${responseTime}ms`);
      console.log(`   📊 Status: ${response.status}`);
      console.log(`   📋 Data: ${JSON.stringify(response.data)}`);
      console.log(`   🔧 Headers: ${JSON.stringify(response.headers['content-type'])}`);
      
      // Pausa entre webhooks para simular tráfico real
      console.log('\n⏳ Esperando antes del siguiente webhook...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (error) {
      console.log('\n❌ ERROR EN WEBHOOK:');
      console.log(`   💥 Message: ${error.message}`);
      if (error.response) {
        console.log(`   📊 Status: ${error.response.status}`);
        console.log(`   📋 Data: ${JSON.stringify(error.response.data)}`);
      }
      if (error.code) {
        console.log(`   🔧 Code: ${error.code}`);
      }
    }
  }
  
  console.log('\n🎉 SIMULACIÓN COMPLETADA');
  console.log('=' .repeat(60));
  console.log('✅ Todos los webhooks externos fueron procesados');
  console.log('📊 El servidor está listo para recibir tráfico real');
  console.log('🔗 Puedes usar ngrok, localtunnel o serveo para exponer el puerto 3000');
}

simulateExternalTunnel();