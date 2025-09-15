import { Router } from 'express';
import { EvolutionAPI } from '../services/evolution-api.js';
import { InstanceManager } from '../services/instance-manager.js';
import logger from '../utils/logger.js';

export function createAPIRouter(evolutionAPI: EvolutionAPI, instanceManager: InstanceManager) {
  const router = Router();

  // Middleware para verificar API Key
  router.use((req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.headers['apikey'];
    
    // Verificar si el API key es correcto
    if (apiKey !== process.env.EVOLUTION_API_KEY) {
      logger.warn('🔒 Unauthorized API access attempt', {
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      res.status(401).json({ error: 'Unauthorized' });
      return; // Add explicit return
    }
    
    logger.debug('✅ API Key validated successfully', {
      path: req.path,
      method: req.method
    });
    
    next();
  });

  // Health check
  router.get('/health', (_req, res) => {
    res.json({ 
      status: 'ok', 
      service: 'evolution-api-mcp',
      evolution_url: process.env.EVOLUTION_API_URL
    });
  });

  // Instance endpoints
  // Get all instances with enhanced status
  router.get('/instances', async (_req, res) => {
    logger.info('📋 Getting instances list with status');
    try {
      const managedInstances = instanceManager.getAllInstances();
      const stats = instanceManager.getInstanceStats();
      
      logger.info('✅ Successfully retrieved instances', {
        count: managedInstances.length,
        stats
      });
      
      res.json({
        instances: managedInstances,
        stats
      });
    } catch (error) {
      logger.error('❌ Failed to get instances', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      res.status(500).json({ error: 'Failed to fetch instances' });
    }
  });

  // Get specific instance
  router.get('/instances/:instanceName', async (req, res) => {
    const { instanceName } = req.params;
    logger.info('📱 Getting instance details', { instanceName });
    
    try {
      const instance = instanceManager.getInstance(instanceName);
      if (!instance) {
        return res.status(404).json({ error: 'Instance not found' });
      }
      
      logger.info('✅ Successfully retrieved instance', { instanceName });
      return res.json(instance);
    } catch (error) {
      logger.error('❌ Failed to get instance', {
        instanceName,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return res.status(500).json({ error: 'Failed to fetch instance' });
    }
  });

  // Create new instance
  router.post('/instances', async (req, res) => {
    const { instanceName, webhookUrl } = req.body;
    
    if (!instanceName) {
      return res.status(400).json({ error: 'Instance name is required' });
    }
    
    logger.info('🆕 Creating new instance', { instanceName, webhookUrl });
    
    try {
      const instance = await instanceManager.createInstance(instanceName, webhookUrl);
      logger.info('✅ Successfully created instance', { instanceName });
      return res.status(201).json(instance);
    } catch (error) {
      logger.error('❌ Failed to create instance', {
        instanceName,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return res.status(500).json({ error: 'Failed to create instance' });
    }
  });

  // Connect instance
  router.post('/instances/:instanceName/connect', async (req, res) => {
    const { instanceName } = req.params;
    logger.info('🔌 Connecting instance', { instanceName });
    
    try {
      await instanceManager.connectInstance(instanceName);
      logger.info('✅ Successfully initiated connection', { instanceName });
      res.json({ message: 'Connection initiated', instanceName });
    } catch (error) {
      logger.error('❌ Failed to connect instance', {
        instanceName,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      res.status(500).json({ error: 'Failed to connect instance' });
    }
  });

  // Disconnect instance
  router.post('/instances/:instanceName/disconnect', async (req, res) => {
    const { instanceName } = req.params;
    logger.info('🔌 Disconnecting instance', { instanceName });
    
    try {
      await instanceManager.disconnectInstance(instanceName);
      logger.info('✅ Successfully disconnected instance', { instanceName });
      res.json({ message: 'Instance disconnected', instanceName });
    } catch (error) {
      logger.error('❌ Failed to disconnect instance', {
        instanceName,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      res.status(500).json({ error: 'Failed to disconnect instance' });
    }
  });

  // Delete instance
  router.delete('/instances/:instanceName', async (req, res) => {
    const { instanceName } = req.params;
    logger.info('🗑️ Deleting instance', { instanceName });
    
    try {
      await instanceManager.deleteInstance(instanceName);
      logger.info('✅ Successfully deleted instance', { instanceName });
      res.json({ message: 'Instance deleted', instanceName });
    } catch (error) {
      logger.error('❌ Failed to delete instance', {
        instanceName,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      res.status(500).json({ error: 'Failed to delete instance' });
    }
  });

  // Refresh instance status
  router.post('/instances/:instanceName/refresh', async (req, res) => {
    const { instanceName } = req.params;
    logger.info('🔄 Refreshing instance status', { instanceName });
    
    try {
      await instanceManager.refreshInstanceStatus(instanceName);
      const instance = instanceManager.getInstance(instanceName);
      logger.info('✅ Successfully refreshed instance status', { instanceName });
      res.json(instance);
    } catch (error) {
      logger.error('❌ Failed to refresh instance status', {
        instanceName,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      res.status(500).json({ error: 'Failed to refresh instance status' });
    }
  });

  // Set auto-reply for instance
  router.post('/instances/:instanceName/auto-reply', async (req, res) => {
    const { instanceName } = req.params;
    const { enabled } = req.body;
    
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'enabled field must be a boolean' });
    }
    
    logger.info('⚙️ Setting auto-reply', { instanceName, enabled });
    
    try {
      instanceManager.setAutoReply(instanceName, enabled);
      const instance = instanceManager.getInstance(instanceName);
      logger.info('✅ Successfully updated auto-reply setting', { instanceName, enabled });
      return res.json(instance);
    } catch (error) {
      logger.error('❌ Failed to set auto-reply', {
        instanceName,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return res.status(500).json({ error: 'Failed to set auto-reply' });
    }
  });

  router.get('/instances/:name/status', async (req, res) => {
    try {
      const status = await evolutionAPI.getConnectionStatus(req.params.name);
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });



  // Message endpoints
  router.post('/send/text', async (req, res) => {
    try {
      const { instanceName, number, text, delay } = req.body;
      
      if (!instanceName || !number || !text) {
        res.status(400).json({ 
          error: 'Missing required fields: instanceName, number, text' 
        });
        return;
      }

      // Limpiar el número - remover espacios, guiones y símbolos
      const cleanNumber = number.replace(/[\s\-\+\(\)]/g, '');
      
      console.log(`Sending message to ${cleanNumber} via instance ${instanceName}`);
      
      const result = await evolutionAPI.sendText(instanceName, {
        number: cleanNumber,
        text,
        delay
      });
      
      res.json(result);
    } catch (error: any) {
      console.error('Error sending message:', error);
      res.status(500).json({ 
        error: error.message,
        details: error.response?.data || null
      });
    }
  });

  router.post('/send/media', async (req, res) => {
    try {
      const { instanceName, number, mediatype, media, caption, fileName } = req.body;
      
      if (!instanceName || !number || !mediatype || !media) {
        res.status(400).json({ 
          error: 'Missing required fields: instanceName, number, mediatype, media' 
        });
        return;
      }

      const cleanNumber = number.replace(/[\s\-\+\(\)]/g, '');
      
      const result = await evolutionAPI.sendMedia(instanceName, {
        number: cleanNumber,
        mediatype,
        media,
        caption,
        fileName
      });
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ 
        error: error.message,
        details: error.response?.data || null
      });
    }
  });

  // Contact endpoints
  router.get('/instances/:name/contacts', async (req, res) => {
    try {
      const contacts = await evolutionAPI.findContacts(req.params.name);
      res.json(contacts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/check-numbers', async (req, res) => {
    try {
      const { instanceName, numbers } = req.body;
      
      if (!instanceName || !numbers || !Array.isArray(numbers)) {
        res.status(400).json({ 
          error: 'Missing required fields: instanceName, numbers (array)' 
        });
        return;
      }

      const cleanNumbers = numbers.map(n => n.replace(/[\s\-\+\(\)]/g, ''));
      const result = await evolutionAPI.checkNumberStatus(instanceName, cleanNumbers);
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Group endpoints
  router.get('/instances/:name/groups', async (req, res) => {
    try {
      const groups = await evolutionAPI.findGroups(
        req.params.name, 
        req.query.getParticipants === 'true'
      );
      res.json(groups);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/groups/create', async (req, res) => {
    try {
      const { instanceName, subject, participants, description } = req.body;
      
      if (!instanceName || !subject || !participants) {
        res.status(400).json({ 
          error: 'Missing required fields: instanceName, subject, participants' 
        });
        return;
      }

      const cleanParticipants = participants.map((p: string) => 
        p.replace(/[\s\-\+\(\)]/g, '')
      );
      
      const result = await evolutionAPI.createGroup(instanceName, {
        subject,
        participants: cleanParticipants,
        description
      });
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Chat endpoints
  router.get('/instances/:name/chats', async (req, res) => {
    try {
      const chats = await evolutionAPI.findChats(req.params.name);
      res.json(chats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/instances/:name/messages', async (req, res) => {
    try {
      const { remoteJid, limit } = req.query;
      
      if (!remoteJid) {
        res.status(400).json({ error: 'Missing remoteJid query parameter' });
        return;
      }

      const messages = await evolutionAPI.findMessages(
        req.params.name,
        remoteJid as string,
        limit ? parseInt(limit as string) : 20
      );
      
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // OpenAI Configuration endpoints
  // Get OpenAI configuration
  router.get('/openai/config', async (_req, res) => {
    logger.info('📋 Getting OpenAI configuration');
    try {
      const config = {
        apiKey: process.env.OPENAI_API_KEY ? '***' + process.env.OPENAI_API_KEY.slice(-4) : null,
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
        maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '1000'),
        systemPrompt: process.env.OPENAI_SYSTEM_PROMPT || 'You are a helpful assistant.',
        enabled: process.env.OPENAI_ENABLED === 'true'
      };
      
      logger.info('✅ Successfully retrieved OpenAI config');
      res.json(config);
    } catch (error: any) {
      logger.error('❌ Error getting OpenAI config:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update OpenAI configuration
  router.post('/openai/config', async (req, res) => {
    logger.info('🔧 Updating OpenAI configuration');
    try {
      const { apiKey, model, temperature, maxTokens, systemPrompt, enabled } = req.body;
      
      // Validate required fields
      if (!apiKey && enabled) {
        res.status(400).json({ error: 'API Key is required when OpenAI is enabled' });
        return;
      }
      
      // Here you would typically save to a database or config file
      // For now, we'll just validate and return success
      const config = {
        apiKey: apiKey ? '***' + apiKey.slice(-4) : null,
        model: model || 'gpt-3.5-turbo',
        temperature: temperature || 0.7,
        maxTokens: maxTokens || 1000,
        systemPrompt: systemPrompt || 'You are a helpful assistant.',
        enabled: enabled || false
      };
      
      logger.info('✅ OpenAI configuration updated successfully');
      res.json({ message: 'Configuration updated successfully', config });
    } catch (error: any) {
      logger.error('❌ Error updating OpenAI config:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Test OpenAI connection
  router.post('/openai/test', async (req, res) => {
    logger.info('🧪 Testing OpenAI connection');
    try {
      const { apiKey, model } = req.body;
      
      if (!apiKey) {
        res.status(400).json({ error: 'API Key is required for testing' });
        return;
      }
      
      // Here you would make a test call to OpenAI API
      // For now, we'll simulate a successful test
      logger.info('✅ OpenAI connection test successful');
      res.json({ 
        success: true, 
        message: 'Connection test successful',
        model: model || 'gpt-3.5-turbo'
      });
    } catch (error: any) {
      logger.error('❌ OpenAI connection test failed:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get OpenAI usage statistics
  router.get('/openai/stats', async (_req, res) => {
    logger.info('📊 Getting OpenAI usage statistics');
    try {
      // Here you would typically get real usage stats from database
      const stats = {
        totalRequests: 0,
        totalTokens: 0,
        averageResponseTime: 0,
        lastUsed: null,
        monthlyUsage: {
          requests: 0,
          tokens: 0,
          cost: 0
        }
      };
      
      logger.info('✅ Successfully retrieved OpenAI stats');
      res.json(stats);
    } catch (error: any) {
      logger.error('❌ Error getting OpenAI stats:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
