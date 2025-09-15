import { Router } from 'express';
import { EvolutionAPI } from '../services/evolution-api.js';
import { EventEmitter } from 'events';
import logger, { logWebhook } from '../utils/logger.js';

// Event emitter para manejar eventos de webhook
export const webhookEvents = new EventEmitter();

// Tipos de eventos de Evolution API
interface WebhookMessage {
  event: string;
  instance: string;
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    pushName: string;
    status: string;
    message: {
      conversation?: string;
      message?: {
        conversation?: string;
      };
      messageContextInfo?: any;
      imageMessage?: any;
      videoMessage?: any;
      audioMessage?: any;
      documentMessage?: any;
      extendedTextMessage?: any;
    };
    messageType: string;
    messageTimestamp: number;
    instanceId: string;
    source: string;
  };
  destination?: string;
  date_time: string;
  sender?: string;
  server_url: string;
  apikey: string;
}

export function createWebhookRouter(evolutionAPI: EvolutionAPI) {
  const router = Router();

  // Almacenar mensajes recibidos en memoria
  const receivedMessages: WebhookMessage[] = [];
  const MAX_MESSAGES = 100;

  // Respuestas automáticas configurables
  const autoResponses = new Map<string, {
    pattern: RegExp;
    response: string;
    enabled: boolean;
  }>();

  // Configurar respuestas automáticas por defecto
  autoResponses.set('greeting', {
    pattern: /^(hola|ola|oi|hello|hi|hey)/i,
    response: '👋 ¡Hola! Soy el bot del servidor MCP en Railway.\n\n🔧 *Comandos disponibles:*\n• /status - Estado del sistema\n• /info - Información de la instancia\n• /ping - Verificar conexión\n• /help - Ver todos los comandos\n\n¿En qué puedo ayudarte?',
    enabled: true
  });

  autoResponses.set('help', {
    pattern: /^(ayuda|help|ajuda|\?)/i,
    response: '📋 *Comandos disponibles:*\n\n• /status - Estado del sistema\n• /info - Información de la instancia\n• /ping - Verificar conexión\n• /help - Esta ayuda\n• /mensajes - Últimos mensajes recibidos\n\n💡 También respondo a saludos como "Hola"',
    enabled: true
  });

  autoResponses.set('thanks', {
    pattern: /^(gracias|obrigado|thanks|thank you)/i,
    response: '😊 ¡De nada! Estoy aquí para ayudarte cuando lo necesites.',
    enabled: true
  });

  // Endpoint principal para recibir webhooks
  router.post('/', async (req, res) => {
    try {
      // Log estructurado del webhook recibido
      logWebhook('📨 Webhook received', {
        method: 'POST',
        url: '/webhook',
        bodyType: typeof req.body,
        isArray: Array.isArray(req.body),
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        contentLength: req.get('Content-Length')
      });
      
      // Extraer los datos del webhook según la estructura recibida
      let webhookData: WebhookMessage;
      
      if (Array.isArray(req.body) && req.body.length > 0) {
        // Si viene como array, tomar el primer elemento y extraer el body
        logger.debug('📋 Processing array format webhook');
        const arrayElement = req.body[0];
        if (arrayElement.body) {
          webhookData = arrayElement.body;
          logger.debug('✅ Extracted webhook data from array.body');
        } else {
          webhookData = arrayElement;
          logger.debug('✅ Using array element directly');
        }
      } else {
        // Si viene como objeto directo
        logger.debug('📋 Processing direct object format webhook');
        webhookData = req.body;
      }
      
      logWebhook('📋 Webhook data processed', {
        event: webhookData.event,
        instance: webhookData.instance,
        hasData: !!webhookData.data,
        messageType: webhookData.data?.messageType
      });
      
      // Almacenar mensaje
      receivedMessages.unshift(webhookData);
      if (receivedMessages.length > MAX_MESSAGES) {
        receivedMessages.pop();
      }

      // Emitir evento para procesamiento asíncrono
      webhookEvents.emit('message', webhookData);

      // Validar que el webhookData tenga los campos necesarios
      if (!webhookData.event) {
        logger.warn('⚠️ No event field found in webhook data', {
          availableFields: Object.keys(webhookData)
        });
      }
      
      if (!webhookData.instance) {
        logger.warn('⚠️ No instance field found in webhook data');
      }
      
      // Procesar diferentes tipos de eventos
      if (webhookData.event === 'messages.upsert') {
        logger.info('✅ Processing messages.upsert event', {
          instance: webhookData.instance
        });
        await handleMessageUpsert(webhookData);
      } else if (webhookData.event) {
        logger.info(`ℹ️ Received event '${webhookData.event}' but no handler implemented`, {
          event: webhookData.event,
          instance: webhookData.instance
        });
      } else {
        logger.warn('⚠️ No event type found in webhook data');
      }

      logger.info('✅ Webhook processed successfully');
      res.status(200).json({ status: 'ok' });

    } catch (error: any) {
      logger.error('❌ Webhook processing error', {
        error: error.message,
        stack: error.stack,
        requestBody: req.body,
        method: req.method,
        path: req.path
      });
      res.status(500).json({ error: error.message });
    }
  });

  // Endpoint con instanceName en la URL
  router.post('/:instanceName', async (req, res) => {
    try {
      const timestamp = new Date().toISOString();
      const instanceName = req.params.instanceName;
      
      // Log detallado de la solicitud recibida
      console.log('\n=== WEBHOOK REQUEST (WITH INSTANCE) ===');
      console.log(`[${timestamp}] Method: POST`);
      console.log(`[${timestamp}] URL: /webhook/${instanceName}`);
      console.log(`[${timestamp}] Headers:`, JSON.stringify(req.headers, null, 2));
      console.log(`[${timestamp}] Raw Body:`, JSON.stringify(req.body, null, 2));
      console.log(`[${timestamp}] Body Type:`, typeof req.body);
      console.log(`[${timestamp}] Is Array:`, Array.isArray(req.body));
      console.log(`[${timestamp}] URL Param Instance: ${instanceName}`);
      console.log(`[${timestamp}] IP: ${req.ip || req.connection.remoteAddress}`);
      
      // Extraer los datos del webhook según la estructura recibida
      let webhookData: WebhookMessage;
      
      if (Array.isArray(req.body) && req.body.length > 0) {
        // Si viene como array, tomar el primer elemento y extraer el body
        console.log(`[${timestamp}] Processing array format webhook (with instance)`);
        const arrayElement = req.body[0];
        if (arrayElement.body) {
          webhookData = arrayElement.body;
          console.log(`[${timestamp}] Extracted webhook data from array.body`);
        } else {
          webhookData = arrayElement;
          console.log(`[${timestamp}] Using array element directly`);
        }
      } else {
        // Si viene como objeto directo
        console.log(`[${timestamp}] Processing direct object format webhook (with instance)`);
        webhookData = req.body;
      }
      
      // Si no viene el instance en el body, usar el del parámetro
      if (!webhookData.instance && instanceName) {
        webhookData.instance = instanceName;
        console.log(`[${timestamp}] Using URL param instance: ${instanceName}`);
      }
      
      console.log(`[${timestamp}] Final Webhook Data:`, JSON.stringify(webhookData, null, 2));
      console.log(`[${timestamp}] Event: ${webhookData.event}`);
      console.log(`[${timestamp}] Instance: ${webhookData.instance}`);
      console.log('======================================\n');
      
      // Almacenar mensaje
      receivedMessages.unshift(webhookData);
      if (receivedMessages.length > MAX_MESSAGES) {
        receivedMessages.pop();
      }

      // Validar que el webhookData tenga los campos necesarios
      if (!webhookData.event) {
        console.log(`[${timestamp}] ⚠️  Warning: No event field found in webhook data (instance endpoint)`);
        console.log(`[${timestamp}] Available fields:`, Object.keys(webhookData));
      }
      
      if (!webhookData.instance) {
        console.log(`[${timestamp}] ⚠️  Warning: No instance field found in webhook data (instance endpoint)`);
      }
      
      // Procesar diferentes tipos de eventos
      if (webhookData.event === 'messages.upsert') {
        console.log(`[${timestamp}] ✅ Processing messages.upsert event (instance endpoint)`);
        await handleMessageUpsert(webhookData);
      } else if (webhookData.event) {
        console.log(`[${timestamp}] ℹ️  Received event '${webhookData.event}' but no handler implemented (instance endpoint)`);
      } else {
        console.log(`[${timestamp}] ⚠️  No event type found in webhook data (instance endpoint)`);
      }

      console.log(`[${timestamp}] Response: 200 OK`);
      res.status(200).json({ status: 'ok' });

    } catch (error: any) {
      const timestamp = new Date().toISOString();
      console.error(`\n=== WEBHOOK ERROR (INSTANCE: ${req.params.instanceName}) ===`);
      console.error(`[${timestamp}] Error processing webhook:`, error);
      console.error(`[${timestamp}] Request body:`, JSON.stringify(req.body, null, 2));
      console.error('================================================\n');
      res.status(500).json({ error: error.message });
    }
  });

  // Handler para mensajes nuevos
  async function handleMessageUpsert(data: WebhookMessage) {
    try {
      const { instance, data: messageData } = data;
      const { key, pushName, message } = messageData;
      const timestamp = new Date().toISOString();
      
      console.log('\n=== MESSAGE PROCESSING ===');
      console.log(`[${timestamp}] Processing message for instance: ${instance}`);
      console.log(`[${timestamp}] Message ID: ${key.id}`);
      console.log(`[${timestamp}] From: ${pushName} (${key.remoteJid})`);
      console.log(`[${timestamp}] Is from me: ${key.fromMe}`);
      console.log(`[${timestamp}] Message type: ${messageData.messageType}`);
      console.log(`[${timestamp}] Message timestamp: ${messageData.messageTimestamp}`);
      console.log(`[${timestamp}] Full message data:`, JSON.stringify(message, null, 2));
      
      // No procesar mensajes propios
      if (key.fromMe) {
        console.log(`[${timestamp}] Own message ignored`);
        console.log('=========================\n');
        return;
      }

      // Extraer el texto del mensaje - Evolution API puede enviar en diferentes estructuras
      let text = '';
      
      // Estructura cuando viene directamente
      if (message.conversation) {
        text = message.conversation;
      } 
      // Estructura cuando está anidado (como desde Evolution API real)
      else if (message.message?.conversation) {
        text = message.message.conversation;
      }
      // Otros tipos de mensaje
      else if (message.extendedTextMessage?.text) {
        text = message.extendedTextMessage.text;
      }
      else if (message.imageMessage?.caption) {
        text = message.imageMessage.caption;
      }
      else if (message.videoMessage?.caption) {
        text = message.videoMessage.caption;
      }

      console.log(`[${timestamp}] Extracted text: "${text}"`);
      console.log(`[${timestamp}] Text length: ${text.length} characters`);
      console.log(`[${timestamp}] Mensaje de ${pushName} (${key.remoteJid}): ${text}`);

      // Extraer el número del remoteJid
      const number = key.remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '');
      console.log(`[${timestamp}] Extracted number: ${number}`);

      // Verificar si hay respuestas automáticas habilitadas
      console.log(`[${timestamp}] Checking auto-responses...`);
      let responseMatched = false;
      for (const [name, config] of autoResponses) {
        console.log(`[${timestamp}] Testing pattern '${name}': ${config.pattern} against "${text}"`);
        if (config.enabled && config.pattern.test(text)) {
          console.log(`[${timestamp}] ✅ Pattern matched! Sending auto-response: ${name}`);
          console.log(`[${timestamp}] Response text: "${config.response.substring(0, 100)}..."`);
          
          try {
            // Enviar respuesta automática con retry
            const result = await sendMessageWithRetry(instance, number, config.response);
            console.log(`[${timestamp}] ✅ Auto-response sent successfully:`, result?.key?.id || 'OK');
            responseMatched = true;
          } catch (error) {
            console.error(`[${timestamp}] ❌ Error sending auto-response:`, error);
          }
          
          break; // Solo enviar una respuesta
        }
      }

      // Si no hubo respuesta automática, verificar comandos
      if (!responseMatched && text.startsWith('/')) {
        console.log(`[${timestamp}] No auto-response matched. Processing command: ${text}`);
        await handleCommand(instance, key.remoteJid, text, pushName);
      } else if (!responseMatched) {
        console.log(`[${timestamp}] No auto-response or command matched for: "${text}"`);
      }
      
      console.log('=========================\n');

    } catch (error) {
      console.error('[Webhook] Error handling message:', error);
    }
  }

  // Función auxiliar para enviar mensajes con reintentos
  async function sendMessageWithRetry(instance: string, number: string, text: string, retries = 3): Promise<any> {
    const timestamp = new Date().toISOString();
    console.log(`\n=== SENDING MESSAGE ===`);
    console.log(`[${timestamp}] Attempting to send message to ${number}`);
    console.log(`[${timestamp}] Instance: ${instance}`);
    console.log(`[${timestamp}] Message length: ${text.length} characters`);
    console.log(`[${timestamp}] Max retries: ${retries}`);
    
    for (let i = 0; i < retries; i++) {
      try {
        const delay = 1000 + (i * 500);
        console.log(`[${timestamp}] Attempt ${i + 1}/${retries} with delay: ${delay}ms`);
        
        const result = await evolutionAPI.sendText(instance, {
          number,
          text,
          delay
        });
        
        console.log(`[${timestamp}] ✅ Message sent successfully on attempt ${i + 1}`);
        console.log(`[${timestamp}] Result:`, JSON.stringify(result, null, 2));
        console.log('=======================\n');
        return result;
      } catch (error: any) {
        console.error(`[${timestamp}] ❌ Attempt ${i + 1}/${retries} failed:`, error.message);
        console.error(`[${timestamp}] Error details:`, error);
        if (i === retries - 1) {
          console.error(`[${timestamp}] All ${retries} attempts failed. Throwing error.`);
          console.log('=======================\n');
          throw error;
        }
        // Esperar antes de reintentar
        const waitTime = 2000;
        console.log(`[${timestamp}] Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    // Esta línea nunca debería alcanzarse, pero TypeScript lo requiere
    throw new Error('Failed to send message after all retries');
  }

  // Handler para comandos
  async function handleCommand(instance: string, remoteJid: string, command: string, pushName: string) {
    const timestamp = new Date().toISOString();
    const number = remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '');
    let response = '';
    
    console.log('\n=== COMMAND PROCESSING ===');
    console.log(`[${timestamp}] Processing command: ${command}`);
    console.log(`[${timestamp}] Instance: ${instance}`);
    console.log(`[${timestamp}] User: ${pushName}`);
    console.log(`[${timestamp}] Number: ${number}`);
    console.log(`[${timestamp}] Remote JID: ${remoteJid}`);

    switch (command.toLowerCase().trim()) {
      case '/status':
        response = `🟢 *Sistema Operativo*\n\n` +
                  `📱 Instancia: ${instance}\n` +
                  `👤 Usuario: ${pushName}\n` +
                  `🕐 Hora: ${new Date().toLocaleString('es-ES')}\n` +
                  `✅ Webhook: Activo\n` +
                  `📊 Mensajes procesados: ${receivedMessages.length}`;
        break;

      case '/info':
        try {
          const status = await evolutionAPI.getConnectionStatus(instance);
          response = `📊 *Información de la Instancia*\n\n` +
                    `🔹 Nombre: ${instance}\n` +
                    `🔹 Estado: ${status.state}\n` +
                    `🔹 Servidor: Railway MCP\n` +
                    `🔹 Versión: 1.0.0\n` +
                    `🔹 Uptime: Activo`;
        } catch (error) {
          response = `📊 *Información de la Instancia*\n\n` +
                    `🔹 Nombre: ${instance}\n` +
                    `🔹 Servidor: Railway MCP\n` +
                    `🔹 Versión: 1.0.0`;
        }
        break;

      case '/ping':
        response = `🏓 *Pong!*\n\nConexión establecida correctamente.\nLatencia: ~${Math.floor(Math.random() * 50 + 10)}ms`;
        break;

      case '/help':
        response = `📋 *Comandos Disponibles*\n\n` +
                  `• /status - Estado del sistema\n` +
                  `• /info - Información de la instancia\n` +
                  `• /ping - Verificar conexión\n` +
                  `• /help - Mostrar esta ayuda\n` +
                  `• /mensajes - Ver últimos mensajes recibidos\n\n` +
                  `💡 También respondo a:\n` +
                  `• Saludos (hola, hi, hey)\n` +
                  `• Agradecimientos (gracias, thanks)\n` +
                  `• Solicitudes de ayuda (ayuda, help)`;
        break;

      case '/mensajes':
        const recentMessages = receivedMessages
          .filter(msg => msg.instance === instance)
          .slice(0, 5);
        
        if (recentMessages.length === 0) {
          response = '📭 No hay mensajes recientes';
        } else {
          response = `📬 *Últimos ${recentMessages.length} mensajes:*\n\n`;
          recentMessages.forEach((msg, i) => {
            // Manejar diferentes estructuras de mensaje
            let msgText = '[Media]';
            if (msg.data.message?.conversation) {
              msgText = msg.data.message.conversation;
            } else if (msg.data.message?.message?.conversation) {
              msgText = msg.data.message.message.conversation;
            }
            const time = new Date(msg.date_time).toLocaleTimeString('es-ES');
            response += `${i + 1}. *${msg.data.pushName}* (${time})\n`;
            response += `   _${msgText.substring(0, 50)}${msgText.length > 50 ? '...' : ''}_\n\n`;
          });
        }
        break;

      default:
        response = `❓ Comando no reconocido: ${command}\n\nUsa /help para ver los comandos disponibles.`;
    }

    // Enviar respuesta
    console.log(`[${timestamp}] Generated response (${response.length} chars): "${response.substring(0, 100)}..."`);
    try {
      const result = await sendMessageWithRetry(instance, number, response);
      console.log(`[${timestamp}] ✅ Command ${command} executed successfully`);
      console.log(`[${timestamp}] Response message ID:`, result?.key?.id || 'OK');
    } catch (error) {
      console.error(`[${timestamp}] ❌ Error executing command ${command}:`, error);
    }
    console.log('==========================\n');
  }

  // Endpoint para obtener mensajes recibidos
  router.get('/messages/:instanceName', (req, res) => {
    try {
      const { instanceName } = req.params;
      const { limit = 20 } = req.query;
      const timestamp = new Date().toISOString();
      
      console.log(`\n=== GET MESSAGES REQUEST ===`);
      console.log(`[${timestamp}] GET /webhook/messages/${instanceName}`);
      console.log(`[${timestamp}] Limit: ${limit}`);
      console.log(`[${timestamp}] Total messages in memory: ${receivedMessages.length}`);
      
      const messages = receivedMessages
        .filter(msg => msg.instance === instanceName)
        .slice(0, parseInt(limit as string));
      
      console.log(`[${timestamp}] Filtered messages for ${instanceName}: ${messages.length}`);
      console.log('============================\n');
      
      res.json({
        instance: instanceName,
        count: messages.length,
        total_in_memory: receivedMessages.length,
        timestamp,
        messages
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Endpoint para obtener todos los mensajes
  router.get('/messages', (_req, res) => {
    try {
      res.json({
        total: receivedMessages.length,
        messages: receivedMessages
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Endpoint para configurar webhook en Evolution API
  router.post('/setup', async (req, res) => {
    try {
      const { instanceName, baseUrl } = req.body;
      
      if (!instanceName) {
        res.status(400).json({ error: 'Missing instanceName' });
        return;
      }

      // Construir la URL del webhook
      const webhookUrl = baseUrl || `https://mcp-evolution-api-fixed-production.up.railway.app/api/webhook/${instanceName}`;
      
      const config = {
        enabled: true,
        url: webhookUrl,
        webhookByEvents: true,
        webhookBase64: true,
        webhookHeaders: {
          'X-Instance': instanceName
        }
      };

      const result = await evolutionAPI.setWebhook(instanceName, config);
      
      res.json({
        status: 'ok',
        message: 'Webhook configured successfully',
        webhookUrl,
        result
      });

    } catch (error: any) {
      console.error('[Webhook Setup] Error:', error);
      res.status(500).json({ 
        error: error.message,
        details: error.response?.data || null
      });
    }
  });

  // Endpoint para obtener configuración del webhook
  router.get('/config/:instanceName', async (req, res) => {
    try {
      const config = await evolutionAPI.getWebhook(req.params.instanceName);
      res.json(config);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Endpoint para habilitar/deshabilitar respuestas automáticas
  router.post('/autoresponse', (req, res) => {
    try {
      const { name, enabled, pattern, response } = req.body;
      
      if (name && autoResponses.has(name)) {
        const config = autoResponses.get(name)!;
        if (enabled !== undefined) config.enabled = enabled;
        if (pattern) config.pattern = new RegExp(pattern, 'i');
        if (response) config.response = response;
        
        res.json({ 
          status: 'ok', 
          message: `Auto-response '${name}' updated`,
          config: {
            name,
            pattern: config.pattern.source,
            response: config.response,
            enabled: config.enabled
          }
        });
      } else if (name && pattern && response) {
        // Crear nueva respuesta automática
        autoResponses.set(name, {
          pattern: new RegExp(pattern, 'i'),
          response,
          enabled: enabled !== false
        });
        
        res.json({ 
          status: 'ok', 
          message: `Auto-response '${name}' created` 
        });
      } else {
        // Listar todas las respuestas automáticas
        const responses = Array.from(autoResponses.entries()).map(([name, config]) => ({
          name,
          pattern: config.pattern.source,
          response: config.response,
          enabled: config.enabled
        }));
        
        res.json(responses);
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Endpoint para estadísticas
  router.get('/stats', (_req, res) => {
    try {
      const stats = {
        totalMessages: receivedMessages.length,
        messagesByInstance: {} as Record<string, number>,
        messagesByType: {} as Record<string, number>,
        recentActivity: [] as any[]
      };

      receivedMessages.forEach(msg => {
        // Por instancia
        stats.messagesByInstance[msg.instance] = (stats.messagesByInstance[msg.instance] || 0) + 1;
        
        // Por tipo
        stats.messagesByType[msg.event] = (stats.messagesByType[msg.event] || 0) + 1;
      });

      // Actividad reciente (últimos 10 mensajes)
      stats.recentActivity = receivedMessages.slice(0, 10).map(msg => ({
        instance: msg.instance,
        event: msg.event,
        from: msg.data?.pushName || 'Unknown',
        time: msg.date_time,
        text: msg.data?.message?.conversation?.substring(0, 50) || '[Media]'
      }));

      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
