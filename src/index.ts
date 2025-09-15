import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { EvolutionAPI } from './services/evolution-api.js';
import { TemplateService } from './services/template-service.js';
import { InstanceManager } from './services/instance-manager.js';
import logger from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Initialize logger
logger.info('🚀 Starting Evolution API MCP Server', {
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  evolutionUrl: process.env.EVOLUTION_API_URL || 'http://localhost:8080'
});

// Initialize services
const evolutionAPI = new EvolutionAPI({
  baseUrl: process.env.EVOLUTION_API_URL || 'http://localhost:8080',
  apiKey: process.env.EVOLUTION_API_KEY || ''
});

const instanceManager = new InstanceManager(evolutionAPI);
const templateService = new TemplateService('./templates');

logger.info('✅ Services initialized successfully');

// Define tools
const tools: Tool[] = [
  // Instance Management Tools
  {
    name: 'create_instance',
    description: 'Create a new WhatsApp instance',
    inputSchema: {
      type: 'object',
      properties: {
        instanceName: { type: 'string', description: 'Name for the instance' },
        qrcode: { type: 'boolean', description: 'Generate QR code for connection' },
        webhookUrl: { type: 'string', description: 'Webhook URL for events' }
      },
      required: ['instanceName']
    }
  },
  {
    name: 'list_instances',
    description: 'List all WhatsApp instances',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'connect_instance',
    description: 'Connect a WhatsApp instance',
    inputSchema: {
      type: 'object',
      properties: {
        instanceName: { type: 'string', description: 'Instance name to connect' }
      },
      required: ['instanceName']
    }
  },
  {
    name: 'instance_status',
    description: 'Get connection status of an instance',
    inputSchema: {
      type: 'object',
      properties: {
        instanceName: { type: 'string', description: 'Instance name' }
      },
      required: ['instanceName']
    }
  },
  {
    name: 'delete_instance',
    description: 'Delete a WhatsApp instance',
    inputSchema: {
      type: 'object',
      properties: {
        instanceName: { type: 'string', description: 'Instance name to delete' }
      },
      required: ['instanceName']
    }
  },

  // Messaging Tools
  {
    name: 'send_text',
    description: 'Send a text message',
    inputSchema: {
      type: 'object',
      properties: {
        instanceName: { type: 'string', description: 'Instance name' },
        number: { type: 'string', description: 'Recipient phone number' },
        text: { type: 'string', description: 'Message text' },
        delay: { type: 'number', description: 'Delay in milliseconds' }
      },
      required: ['instanceName', 'number', 'text']
    }
  },
  {
    name: 'send_media',
    description: 'Send media (image, video, audio, document)',
    inputSchema: {
      type: 'object',
      properties: {
        instanceName: { type: 'string', description: 'Instance name' },
        number: { type: 'string', description: 'Recipient phone number' },
        mediatype: {
          type: 'string',
          enum: ['image', 'video', 'audio', 'document'],
          description: 'Type of media'
        },
        media: { type: 'string', description: 'Media URL or base64' },
        caption: { type: 'string', description: 'Media caption' },
        fileName: { type: 'string', description: 'File name for documents' }
      },
      required: ['instanceName', 'number', 'mediatype', 'media']
    }
  },
  {
    name: 'send_buttons',
    description: 'Send message with buttons',
    inputSchema: {
      type: 'object',
      properties: {
        instanceName: { type: 'string', description: 'Instance name' },
        number: { type: 'string', description: 'Recipient phone number' },
        title: { type: 'string', description: 'Message title' },
        description: { type: 'string', description: 'Message description' },
        footer: { type: 'string', description: 'Message footer' },
        buttons: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              buttonId: { type: 'string' },
              displayText: { type: 'string' }
            }
          },
          description: 'Array of buttons'
        }
      },
      required: ['instanceName', 'number', 'buttons']
    }
  },
  {
    name: 'send_list',
    description: 'Send interactive list message',
    inputSchema: {
      type: 'object',
      properties: {
        instanceName: { type: 'string', description: 'Instance name' },
        number: { type: 'string', description: 'Recipient phone number' },
        title: { type: 'string', description: 'List title' },
        description: { type: 'string', description: 'List description' },
        buttonText: { type: 'string', description: 'Button text' },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              rows: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    rowId: { type: 'string' }
                  }
                }
              }
            }
          },
          description: 'List sections'
        }
      },
      required: ['instanceName', 'number', 'sections']
    }
  },

  // Template Tools
  {
    name: 'list_templates',
    description: 'List all message templates',
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'Filter by category' },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by tags'
        }
      }
    }
  },
  {
    name: 'get_template',
    description: 'Get a specific template by ID',
    inputSchema: {
      type: 'object',
      properties: {
        templateId: { type: 'string', description: 'Template ID' }
      },
      required: ['templateId']
    }
  },
  {
    name: 'create_template',
    description: 'Create a new message template',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Template name' },
        description: { type: 'string', description: 'Template description' },
        category: { type: 'string', description: 'Template category' },
        text: { type: 'string', description: 'Template text with {{variables}}' },
        variables: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of variable names'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Template tags'
        }
      },
      required: ['name', 'text']
    }
  },
  {
    name: 'send_template',
    description: 'Send a message using a template',
    inputSchema: {
      type: 'object',
      properties: {
        instanceName: { type: 'string', description: 'Instance name' },
        number: { type: 'string', description: 'Recipient phone number' },
        templateId: { type: 'string', description: 'Template ID' },
        variables: {
          type: 'object',
          description: 'Variables to replace in template'
        }
      },
      required: ['instanceName', 'number', 'templateId', 'variables']
    }
  },
  {
    name: 'delete_template',
    description: 'Delete a custom template',
    inputSchema: {
      type: 'object',
      properties: {
        templateId: { type: 'string', description: 'Template ID to delete' }
      },
      required: ['templateId']
    }
  },
  {
    name: 'update_template',
    description: 'Update an existing template',
    inputSchema: {
      type: 'object',
      properties: {
        templateId: { type: 'string', description: 'Template ID' },
        name: { type: 'string', description: 'New name' },
        description: { type: 'string', description: 'New description' },
        text: { type: 'string', description: 'New text' },
        variables: {
          type: 'array',
          items: { type: 'string' },
          description: 'New variables list'
        }
      },
      required: ['templateId']
    }
  },
  {
    name: 'search_templates',
    description: 'Search templates by text',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' }
      },
      required: ['query']
    }
  },

  // Contact Management Tools
  {
    name: 'list_contacts',
    description: 'List all contacts',
    inputSchema: {
      type: 'object',
      properties: {
        instanceName: { type: 'string', description: 'Instance name' }
      },
      required: ['instanceName']
    }
  },
  {
    name: 'check_number',
    description: 'Check if phone numbers have WhatsApp',
    inputSchema: {
      type: 'object',
      properties: {
        instanceName: { type: 'string', description: 'Instance name' },
        numbers: {
          type: 'array',
          items: { type: 'string' },
          description: 'Phone numbers to check'
        }
      },
      required: ['instanceName', 'numbers']
    }
  },

  // Group Management Tools
  {
    name: 'create_group',
    description: 'Create a new WhatsApp group',
    inputSchema: {
      type: 'object',
      properties: {
        instanceName: { type: 'string', description: 'Instance name' },
        subject: { type: 'string', description: 'Group name' },
        participants: {
          type: 'array',
          items: { type: 'string' },
          description: 'Phone numbers of participants'
        },
        description: { type: 'string', description: 'Group description' }
      },
      required: ['instanceName', 'subject', 'participants']
    }
  },
  {
    name: 'list_groups',
    description: 'List all groups',
    inputSchema: {
      type: 'object',
      properties: {
        instanceName: { type: 'string', description: 'Instance name' },
        getParticipants: { type: 'boolean', description: 'Include participants list' }
      },
      required: ['instanceName']
    }
  },
  {
    name: 'add_participants',
    description: 'Add participants to a group',
    inputSchema: {
      type: 'object',
      properties: {
        instanceName: { type: 'string', description: 'Instance name' },
        groupJid: { type: 'string', description: 'Group JID' },
        participants: {
          type: 'array',
          items: { type: 'string' },
          description: 'Phone numbers to add'
        }
      },
      required: ['instanceName', 'groupJid', 'participants']
    }
  },
  {
    name: 'remove_participants',
    description: 'Remove participants from a group',
    inputSchema: {
      type: 'object',
      properties: {
        instanceName: { type: 'string', description: 'Instance name' },
        groupJid: { type: 'string', description: 'Group JID' },
        participants: {
          type: 'array',
          items: { type: 'string' },
          description: 'Phone numbers to remove'
        }
      },
      required: ['instanceName', 'groupJid', 'participants']
    }
  },

  // Chat Management Tools
  {
    name: 'get_chats',
    description: 'Get all chats',
    inputSchema: {
      type: 'object',
      properties: {
        instanceName: { type: 'string', description: 'Instance name' }
      },
      required: ['instanceName']
    }
  },
  {
    name: 'get_messages',
    description: 'Get messages from a chat',
    inputSchema: {
      type: 'object',
      properties: {
        instanceName: { type: 'string', description: 'Instance name' },
        remoteJid: { type: 'string', description: 'Chat JID' },
        limit: { type: 'number', description: 'Number of messages to retrieve' }
      },
      required: ['instanceName', 'remoteJid']
    }
  },
  {
    name: 'read_message',
    description: 'Mark message as read',
    inputSchema: {
      type: 'object',
      properties: {
        instanceName: { type: 'string', description: 'Instance name' },
        remoteJid: { type: 'string', description: 'Chat JID' },
        fromMe: { type: 'boolean', description: 'Is message from me' },
        id: { type: 'string', description: 'Message ID' }
      },
      required: ['instanceName', 'remoteJid']
    }
  }
];

// Create MCP server
class EvolutionMCPServer {
  private server: Server;

  constructor() {
    logger.info('🔧 Initializing MCP Server', {
      name: 'evolution-api-mcp',
      version: '1.0.0'
    });

    this.server = new Server(
      {
        name: 'evolution-api-mcp',
        version: '1.0.0'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    logger.info('✅ MCP Server initialized successfully');
    this.setupHandlers();
  }

  private setupHandlers() {
    // List tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools
    }));

    // Call tool handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      logger.info(`🔧 MCP Tool called: ${name}`, {
        toolName: name,
        arguments: Object.keys(args || {})
      });

      try {
        switch (name) {
          // Instance Management
          case 'create_instance':
            return await this.handleCreateInstance(args);
          case 'list_instances':
            return await this.handleListInstances();
          case 'connect_instance':
            return await this.handleConnectInstance(args);
          case 'instance_status':
            return await this.handleInstanceStatus(args);
          case 'delete_instance':
            return await this.handleDeleteInstance(args);

          // Messaging
          case 'send_text':
            return await this.handleSendText(args);
          case 'send_media':
            return await this.handleSendMedia(args);
          case 'send_buttons':
            return await this.handleSendButtons(args);
          case 'send_list':
            return await this.handleSendList(args);

          // Templates
          case 'list_templates':
            return await this.handleListTemplates(args);
          case 'get_template':
            return await this.handleGetTemplate(args);
          case 'create_template':
            return await this.handleCreateTemplate(args);
          case 'send_template':
            return await this.handleSendTemplate(args);
          case 'delete_template':
            return await this.handleDeleteTemplate(args);
          case 'update_template':
            return await this.handleUpdateTemplate(args);
          case 'search_templates':
            return await this.handleSearchTemplates(args);

          // Contacts
          case 'list_contacts':
            return await this.handleListContacts(args);
          case 'check_number':
            return await this.handleCheckNumber(args);

          // Groups
          case 'create_group':
            return await this.handleCreateGroup(args);
          case 'list_groups':
            return await this.handleListGroups(args);
          case 'add_participants':
            return await this.handleAddParticipants(args);
          case 'remove_participants':
            return await this.handleRemoveParticipants(args);

          // Chats
          case 'get_chats':
            return await this.handleGetChats(args);
          case 'get_messages':
            return await this.handleGetMessages(args);
          case 'read_message':
            return await this.handleReadMessage(args);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error: any) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        logger.error(`❌ MCP Tool error: ${name}`, {
          toolName: name,
          error: errorMessage,
          stack: error instanceof Error ? error.stack : undefined
        });
        
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${errorMessage}`
            }
          ]
        };
      }
    });
  }

  // Instance Management Handlers
  private async handleCreateInstance(args: any) {
    const result = await evolutionAPI.createInstance(args);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleListInstances() {
    const instances = await evolutionAPI.fetchInstances();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(instances, null, 2)
        }
      ]
    };
  }

  private async handleConnectInstance(args: any) {
    const result = await evolutionAPI.connectInstance(args.instanceName);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleInstanceStatus(args: any) {
    const status = await evolutionAPI.getConnectionStatus(args.instanceName);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(status, null, 2)
        }
      ]
    };
  }

  private async handleDeleteInstance(args: any) {
    const result = await evolutionAPI.deleteInstance(args.instanceName);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  // Messaging Handlers
  private async handleSendText(args: any) {
    const result = await evolutionAPI.sendText(args.instanceName, {
      number: args.number,
      text: args.text,
      delay: args.delay
    });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleSendMedia(args: any) {
    const result = await evolutionAPI.sendMedia(args.instanceName, {
      number: args.number,
      mediatype: args.mediatype,
      media: args.media,
      caption: args.caption,
      fileName: args.fileName
    });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleSendButtons(args: any) {
    const buttons = args.buttons.map((btn: any) => ({
      buttonId: btn.buttonId,
      buttonText: { displayText: btn.displayText }
    }));

    const result = await evolutionAPI.sendButtons(args.instanceName, {
      number: args.number,
      title: args.title,
      description: args.description,
      footer: args.footer,
      buttons
    });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleSendList(args: any) {
    const result = await evolutionAPI.sendList(args.instanceName, {
      number: args.number,
      title: args.title,
      description: args.description,
      buttonText: args.buttonText,
      sections: args.sections
    });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  // Template Handlers
  private async handleListTemplates(args: any) {
    let templates;

    if (args.category) {
      templates = templateService.getTemplatesByCategory(args.category);
    } else if (args.tags && args.tags.length > 0) {
      templates = templateService.getTemplatesByTags(args.tags);
    } else {
      templates = templateService.getAllTemplates();
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(templates, null, 2)
        }
      ]
    };
  }

  private async handleGetTemplate(args: any) {
    const template = templateService.getTemplate(args.templateId);
    if (!template) {
      throw new Error(`Template ${args.templateId} not found`);
    }
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(template, null, 2)
        }
      ]
    };
  }

  private async handleCreateTemplate(args: any) {
    const template = await templateService.createTemplate({
      name: args.name,
      description: args.description,
      category: args.category,
      content: {
        text: args.text
      },
      variables: args.variables,
      tags: args.tags
    });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(template, null, 2)
        }
      ]
    };
  }

  private async handleSendTemplate(args: any) {
    const template = templateService.getTemplate(args.templateId);
    if (!template) {
      throw new Error(`Template ${args.templateId} not found`);
    }

    // Validate variables
    const missingVars = templateService.validateVariables(template, args.variables);
    if (missingVars.length > 0) {
      throw new Error(`Missing variables: ${missingVars.join(', ')}`);
    }

    // Process template
    const processedContent = templateService.processTemplate(template, args.variables);

    // Send message based on content type
    let result;
    if (processedContent.text) {
      result = await evolutionAPI.sendText(args.instanceName, {
        number: args.number,
        text: processedContent.text
      });
    } else if (processedContent.listMessage) {
      result = await evolutionAPI.sendList(args.instanceName, {
        number: args.number,
        ...processedContent.listMessage
      });
    } else if (processedContent.buttons) {
      result = await evolutionAPI.sendButtons(args.instanceName, {
        number: args.number,
        buttons: processedContent.buttons
      });
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleDeleteTemplate(args: any) {
    const deleted = await templateService.deleteTemplate(args.templateId);
    return {
      content: [
        {
          type: 'text',
          text: deleted ? 'Template deleted successfully' : 'Cannot delete default template or template not found'
        }
      ]
    };
  }

  private async handleUpdateTemplate(args: any) {
    const updates: any = {};
    if (args.name) updates.name = args.name;
    if (args.description) updates.description = args.description;
    if (args.text) updates.content = { text: args.text };
    if (args.variables) updates.variables = args.variables;

    const updated = await templateService.updateTemplate(args.templateId, updates);
    if (!updated) {
      throw new Error(`Template ${args.templateId} not found`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(updated, null, 2)
        }
      ]
    };
  }

  private async handleSearchTemplates(args: any) {
    const templates = templateService.searchTemplates(args.query);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(templates, null, 2)
        }
      ]
    };
  }

  // Contact Handlers
  private async handleListContacts(args: any) {
    const contacts = await evolutionAPI.findContacts(args.instanceName);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(contacts, null, 2)
        }
      ]
    };
  }

  private async handleCheckNumber(args: any) {
    const result = await evolutionAPI.checkNumberStatus(args.instanceName, args.numbers);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  // Group Handlers
  private async handleCreateGroup(args: any) {
    const result = await evolutionAPI.createGroup(args.instanceName, {
      subject: args.subject,
      participants: args.participants,
      description: args.description
    });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleListGroups(args: any) {
    const groups = await evolutionAPI.findGroups(args.instanceName, args.getParticipants);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(groups, null, 2)
        }
      ]
    };
  }

  private async handleAddParticipants(args: any) {
    const result = await evolutionAPI.addGroupParticipants(args.instanceName, {
      groupJid: args.groupJid,
      participants: args.participants
    });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  private async handleRemoveParticipants(args: any) {
    const result = await evolutionAPI.removeGroupParticipants(args.instanceName, {
      groupJid: args.groupJid,
      participants: args.participants
    });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  // Chat Handlers
  private async handleGetChats(args: any) {
    const chats = await evolutionAPI.findChats(args.instanceName);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(chats, null, 2)
        }
      ]
    };
  }

  private async handleGetMessages(args: any) {
    const messages = await evolutionAPI.findMessages(
      args.instanceName,
      args.remoteJid,
      args.limit || 20
    );
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(messages, null, 2)
        }
      ]
    };
  }

  private async handleReadMessage(args: any) {
    const result = await evolutionAPI.readMessage(args.instanceName, {
      remoteJid: args.remoteJid,
      fromMe: args.fromMe,
      id: args.id
    });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  async start() {
    // Initialize template service
    await templateService.initialize();

    // Start MCP server
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Evolution API MCP Server running on stdio');
  }
}

// Express API server for cloud deployment
const app = express();
app.use(express.json());

// Add HTTP logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http(`${req.method} ${req.path}`, {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  });
  next();
});

// Import routers
import { createAPIRouter } from './routes/api.js';
import { createWebhookRouter } from './routes/webhook.js';

// Serve static files for dashboard
// In production (dist/), go up one level to reach public/
// In development (src/), go up one level to reach public/
const publicPath = process.env.NODE_ENV === 'production' 
  ? path.join(__dirname, '..', 'public')
  : path.join(__dirname, '..', 'public');

// Serve static files
app.use(express.static(publicPath));

// Login route
app.get('/login', (_req, res) => {
  res.sendFile(path.join(publicPath, 'login.html'));
});

// Dashboard route (protected)
app.get('/dashboard', (_req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Main dashboard route
app.get('/index.html', (_req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Webhook routes (SIN autenticación)
app.use('/api/webhook', createWebhookRouter(evolutionAPI));

// API routes (CON autenticación) 
app.use('/api', createAPIRouter(evolutionAPI, instanceManager));

// Root endpoint - redirect to login
app.get('/', (_req, res) => {
  res.redirect('/login');
});

// API info endpoint
app.get('/info', (_req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'evolution-api-mcp',
    version: '1.0.0',
    dashboard: '/dashboard',
    login: '/login',
    endpoints: {
      health: '/api/health',
      instances: '/api/instances',
      send_text: '/api/send/text',
      send_media: '/api/send/media',
      contacts: '/api/instances/:name/contacts',
      groups: '/api/instances/:name/groups',
      chats: '/api/instances/:name/chats',
      webhook: {
        receive: '/api/webhook',
        receive_instance: '/api/webhook/:instanceName',
        setup: '/api/webhook/setup',
        config: '/api/webhook/config/:instanceName',
        messages: '/api/webhook/messages',
        stats: '/api/webhook/stats',
        autoresponse: '/api/webhook/autoresponse'
      }
    }
  });
});

// Start servers
async function main() {
  const mcpServer = new EvolutionMCPServer();

  // Start MCP server for local use
  if (process.env.NODE_ENV !== 'production') {
    await mcpServer.start();
  }

  // Start Express server for cloud deployment
  const PORT = process.env.MCP_SERVER_PORT || 3000;
  app.listen(PORT, () => {
    logger.info(`🌐 Webhook server started`, {
      port: PORT,
      webhookEndpoint: `http://localhost:${PORT}/api/webhook`,
      apiEndpoint: `http://localhost:${PORT}/api`
    });
    
    console.log(`🌐 Webhook server running on port ${PORT}`);
    console.log(`📡 Webhook endpoint: http://localhost:${PORT}/api/webhook`);
    console.log(`🔧 API endpoint: http://localhost:${PORT}/api`);
    console.log('\n📋 Available endpoints:');
    console.log('  POST /api/webhook - Receive Evolution API webhooks');
    console.log('  GET  /api/instances - List instances');
    console.log('  POST /api/instances - Create instance');
    console.log('  GET  /api/templates - List templates');
    console.log('  POST /api/templates - Create template');
    console.log('\n🚀 Server ready to receive webhooks!');
  });
}

main().catch(console.error);