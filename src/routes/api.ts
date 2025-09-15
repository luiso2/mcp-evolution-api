import { Router } from 'express';
import { EvolutionAPI } from '../services/evolution-api.js';

export function createAPIRouter(evolutionAPI: EvolutionAPI) {
  const router = Router();

  // Middleware para verificar API Key
  router.use((req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.headers['apikey'];
    
    // Verificar si el API key es correcto
    if (apiKey !== process.env.EVOLUTION_API_KEY) {
      res.status(401).json({ error: 'Unauthorized' });
      return; // Add explicit return
    }
    
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
  router.get('/instances', async (_req, res) => {
    try {
      const instances = await evolutionAPI.fetchInstances();
      res.json(instances);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
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

  router.post('/instances/:name/connect', async (req, res) => {
    try {
      const result = await evolutionAPI.connectInstance(req.params.name);
      res.json(result);
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

  return router;
}
