import { Router } from 'express';
import { EvolutionAPI } from '../services/evolution-api.js';
import { EventEmitter } from 'events';

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
      imageMessage?: any;
      videoMessage?: any;
      audioMessage?: any;
      documentMessage?: any;
      extendedTextMessage?: any;
      messageContextInfo?: any;
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

  // Configurar algunas respuestas automáticas por defecto
  autoResponses.set('greeting', {
    pattern: /^(hola|ola|oi|hello|hi|hey)/i,
    response: '¡Hola! 👋 Este es un mensaje automático del servidor MCP.',
    enabled: false
  });

  autoResponses.set('help', {
    pattern: /^(ayuda|help|ajuda|\?)/i,
    response: '📋 *Comandos disponibles:*\n\n• /status - Estado del sistema\n• /info - Información de la instancia\n• /ping - Verificar conexión',
    enabled: false
  });

  // Endpoint principal para recibir webhooks
  router.post('/webhook', async (req, res) => {
    try {
      const webhookData: WebhookMessage = req.body;
      
      console.log(`[Webhook] Event: ${webhookData.event} | Instance: ${webhookData.instance}`);
      
      // Almacenar mensaje
      receivedMessages.unshift(webhookData);
      if (receivedMessages.length > MAX_MESSAGES) {
        receivedMessages.pop();
      }

      // Emitir evento para procesamiento asíncrono
      webhookEvents.emit('message', webhookData);

      // Procesar diferentes tipos de eventos
      switch (webhookData.event) {
        case 'messages.upsert':
          await handleMessageUpsert(webhookData);
          break;
        
        case 'messages.update':
          console.log(`[Webhook] Message updated: ${webhookData.data.key.id}`);
          break;
        
        case 'messages.delete':
          console.log(`[Webhook] Message deleted: ${webhookData.data.key.id}`);
          break;
        
        case 'connection.update':
          console.log(`[Webhook] Connection update for ${webhookData.instance}`);
          break;
        
        case 'groups.upsert':
        case 'groups.update':
          console.log(`[Webhook] Group event: ${webhookData.event}`);
          break;
        
        case 'presence.update':
          console.log(`[Webhook] Presence update`);
          break;
        
        default:
          console.log(`[Webhook] Unhandled event: ${webhookData.event}`);
      }

      res.status(200).json({ status: 'ok' });

    } catch (error: any) {
      console.error('[Webhook] Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Endpoint alternativo con instanceName en la URL (compatible con tu configuración)
  router.post('/webhook/:instanceName', async (req, res) => {
    try {
      const webhookData: WebhookMessage = req.body;
      
      // Si no viene el instance en el body, usar el del parámetro
      if (!webhookData.instance && req.params.instanceName) {
        webhookData.instance = req.params.instanceName;
      }

      console.log(`[Webhook/${req.params.instanceName}] Event: ${webhookData.event}`);
      
      // Almacenar mensaje
      receivedMessages.unshift(webhookData);
      if (receivedMessages.length > MAX_MESSAGES) {
        receivedMessages.pop();
      }

      // Procesar el mensaje
      if (webhookData.event === 'messages.upsert') {
        await handleMessageUpsert(webhookData);
      }

      res.status(200).json({ status: 'ok' });

    } catch (error: any) {
      console.error(`[Webhook/${req.params.instanceName}] Error:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  // Handler para mensajes nuevos
  async function handleMessageUpsert(data: WebhookMessage) {
    try {
      const { instance, data: messageData } = data;
      const { key, pushName, message } = messageData;
      
      // No procesar mensajes propios
      if (key.fromMe) {
        console.log(`[${instance}] Mensaje propio ignorado`);
        return;
      }

      // Extraer el texto del mensaje
      const text = message.conversation || 
                   message.extendedTextMessage?.text || 
                   message.imageMessage?.caption ||
                   message.videoMessage?.caption || '';

      console.log(`[${instance}] Mensaje de ${pushName} (${key.remoteJid}): ${text}`);

      // Verificar si hay respuestas automáticas habilitadas
      for (const [name, config] of autoResponses) {
        if (config.enabled && config.pattern.test(text)) {
          console.log(`[${instance}] Enviando respuesta automática: ${name}`);
          
          // Extraer el número del remoteJid
          const number = key.remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '');
          
          // Enviar respuesta automática
          await evolutionAPI.sendText(instance, {
            number,
            text: config.response,
            delay: 1000 // Delay de 1 segundo para parecer más natural
          });
          
          break; // Solo enviar una respuesta
        }
      }

      // Comandos especiales
      if (text.startsWith('/')) {
        await handleCommand(instance, key.remoteJid, text, pushName);
      }

    } catch (error) {
      console.error('[Webhook] Error handling message:', error);
    }
  }

  // Handler para comandos
  async function handleCommand(instance: string, remoteJid: string, command: string, pushName: string) {
    const number = remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '');
    let response = '';

    switch (command.toLowerCase().trim()) {
      case '/status':
        response = `🟢 *Sistema Operativo*\n\n` +
                  `📱 Instancia: ${instance}\n` +
                  `👤 Usuario: ${pushName}\n` +
                  `🕐 Hora: ${new Date().toLocaleString('es-ES')}\n` +
                  `✅ Webhook: Activo`;
        break;

      case '/info':
        const status = await evolutionAPI.getConnectionStatus(instance);
        response = `📊 *Información de la Instancia*\n\n` +
                  `🔹 Nombre: ${instance}\n` +
                  `🔹 Estado: ${status.state}\n` +
                  `🔹 Servidor: Railway MCP\n` +
                  `🔹 Versión: 1.0.0`;
        break;

      case '/ping':
        response = `🏓 *Pong!*\n\nConexión establecida correctamente.`;
        break;

      case '/help':
        response = `📋 *Comandos Disponibles*\n\n` +
                  `• /status - Estado del sistema\n` +
                  `• /info - Información de la instancia\n` +
                  `• /ping - Verificar conexión\n` +
                  `• /help - Mostrar esta ayuda\n` +
                  `• /mensajes - Ver últimos mensajes recibidos`;
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
            const msgText = msg.data.message.conversation || '[Media]';
            const time = new Date(msg.date_time).toLocaleTimeString('es-ES');
            response += `${i + 1}. ${msg.data.pushName} (${time})\n   ${msgText.substring(0, 50)}${msgText.length > 50 ? '...' : ''}\n\n`;
          });
        }
        break;

      default:
        response = `❓ Comando no reconocido: ${command}\n\nUsa /help para ver los comandos disponibles.`;
    }

    // Enviar respuesta
    await evolutionAPI.sendText(instance, {
      number,
      text: response,
      delay: 500
    });
  }

  // Endpoint para obtener mensajes recibidos
  router.get('/webhook/messages/:instanceName', (req, res) => {
    const { instanceName } = req.params;
    const { limit = 20 } = req.query;
    
    const messages = receivedMessages
      .filter(msg => msg.instance === instanceName)
      .slice(0, parseInt(limit as string));
    
    res.json({
      instance: instanceName,
      count: messages.length,
      messages
    });
  });

  // Endpoint para obtener todos los mensajes
  router.get('/webhook/messages', (_req, res) => {
    res.json({
      total: receivedMessages.length,
      messages: receivedMessages
    });
  });

  // Endpoint para configurar webhook en Evolution API
  router.post('/webhook/setup', async (req, res) => {
    try {
      const { instanceName, baseUrl } = req.body;
      
      if (!instanceName) {
        res.status(400).json({ error: 'Missing instanceName' });
        return;
      }

      // Construir la URL del webhook
      const webhookUrl = baseUrl || `https://mcp-evolution-api-fixed-production.up.railway.app/api/webhook/${instanceName}`;
      
      const config = {
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
      res.status(500).json({ error: error.message });
    }
  });

  // Endpoint para obtener configuración del webhook
  router.get('/webhook/config/:instanceName', async (req, res) => {
    try {
      const config = await evolutionAPI.getWebhook(req.params.instanceName);
      res.json(config);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Endpoint para habilitar/deshabilitar respuestas automáticas
  router.post('/webhook/autoresponse', (req, res) => {
    const { name, enabled, pattern, response } = req.body;
    
    if (name && autoResponses.has(name)) {
      const config = autoResponses.get(name)!;
      if (enabled !== undefined) config.enabled = enabled;
      if (pattern) config.pattern = new RegExp(pattern, 'i');
      if (response) config.response = response;
      
      res.json({ 
        status: 'ok', 
        message: `Auto-response '${name}' updated`,
        config 
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
  });

  // Endpoint para estadísticas
  router.get('/webhook/stats', (_req, res) => {
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
      from: msg.data.pushName,
      time: msg.date_time,
      text: msg.data.message?.conversation?.substring(0, 50) || '[Media]'
    }));

    res.json(stats);
  });

  return router;
}
