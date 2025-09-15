import axios from 'axios';

// JSON de prueba basado en el que proporcionaste
const testWebhookData = [
  {
    "headers": {
      "host": "n8n-n8n.dqyvuv.easypanel.host",
      "user-agent": "axios/1.7.9",
      "content-length": "984",
      "accept-encoding": "gzip, compress, deflate, br",
      "content-type": "application/json",
      "x-forwarded-for": "172.18.0.1",
      "x-forwarded-host": "n8n-n8n.dqyvuv.easypanel.host",
      "x-forwarded-port": "443",
      "x-forwarded-proto": "https",
      "x-forwarded-server": "321db4dd9008",
      "x-real-ip": "172.18.0.1"
    },
    "params": {},
    "query": {},
    "body": {
      "event": "messages.upsert",
      "instance": "Luis2",
      "data": {
        "key": {
          "remoteJid": "554198908495@s.whatsapp.net",
          "fromMe": false,
          "id": "3F883A0B44FFF34D1BA3"
        },
        "pushName": "Luis",
        "status": "DELIVERY_ACK",
        "message": {
          "messageContextInfo": {
            "deviceListMetadata": {
              "senderKeyHash": "b5TTe1Nptwz9Mg==",
              "senderTimestamp": "1756896194",
              "recipientKeyHash": "wbccgdouZIbDZA==",
              "recipientTimestamp": "1757897152"
            },
            "deviceListMetadataVersion": 2
          },
          "conversation": "Hola"
        },
        "contextInfo": {
          "expiration": 0,
          "ephemeralSettingTimestamp": "0",
          "disappearingMode": {
            "initiator": "CHANGED_IN_CHAT"
          }
        },
        "messageType": "conversation",
        "messageTimestamp": 1757901163,
        "instanceId": "f2236efe-4bcc-4d4e-9810-25c4358528c1",
        "source": "unknown"
      },
      "destination": "https://n8n-n8n.dqyvuv.easypanel.host/webhook-test/8d80e7d2-e2ae-4eac-b4f5-dbbafab10697",
      "date_time": "2025-09-14T22:52:43.731Z",
      "sender": "554197034153@s.whatsapp.net",
      "server_url": "https://evolution-api-evolution-api.dqyvuv.easypanel.host",
      "apikey": "BC10D87095B7-44E2-B1A4-F03BE2BECE24"
    },
    "webhookUrl": "https://n8n-n8n.dqyvuv.easypanel.host/webhook-test/8d80e7d2-e2ae-4eac-b4f5-dbbafab10697",
    "executionMode": "test"
  }
];

async function testWebhook() {
  try {
    console.log('🚀 Enviando webhook de prueba...');
    console.log('📦 Datos a enviar:', JSON.stringify(testWebhookData, null, 2));
    
    const response = await axios.post('http://localhost:3000/api/webhook', testWebhookData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Respuesta del webhook:', response.status, response.data);
    
  } catch (error) {
    console.error('❌ Error al enviar webhook:', error.response?.data || error.message);
  }
}

// Ejecutar la prueba
testWebhook();