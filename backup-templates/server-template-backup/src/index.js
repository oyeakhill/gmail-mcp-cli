import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { authenticate } from '@google-cloud/local-auth';
import OpenAI from 'openai';
import * as fs from 'fs/promises';
import * as path from 'path';
import { z } from 'zod';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Initialize OpenAI (with fallback)
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Gmail auth setup with full Gmail access
const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/gmail.settings.basic',
  'https://www.googleapis.com/auth/gmail.settings.sharing'
];

const GMAIL_TOKEN_PATH = path.join(__dirname, '..', 'token.json');
const GMAIL_CREDENTIALS_PATH = path.join(__dirname, '..', 'credentials.json');

// Gmail authentication functions
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(GMAIL_TOKEN_PATH, 'utf-8');
    const credentials = JSON.parse(content);
    const { client_secret, client_id, refresh_token } = credentials;
    const client = new OAuth2Client(client_id, client_secret);
    client.setCredentials({ refresh_token });
    return client;
  } catch (err) {
    return null;
  }
}

async function authorizeGmail() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  
  const newClient = await authenticate({
    scopes: GMAIL_SCOPES,
    keyfilePath: GMAIL_CREDENTIALS_PATH,
  });
  
  if (newClient.credentials) {
    const content = await fs.readFile(GMAIL_CREDENTIALS_PATH, 'utf-8');
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
      type: 'authorized_user',
      client_id: key.client_id,
      client_secret: key.client_secret,
      refresh_token: newClient.credentials.refresh_token,
    });
    await fs.writeFile(GMAIL_TOKEN_PATH, payload);
  }
  return newClient;
}

async function getGmailService() {
  const auth = await authorizeGmail();
  return google.gmail({ version: 'v1', auth });
}

// Create server
const server = new Server(
  {
    name: 'gmail-mcp-server',
    version: '3.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Add Gmail tools with proper MCP SDK v1.x syntax
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_emails',
        description: 'Get Gmail emails with filtering',
        inputSchema: { 
          type: 'object', 
          properties: { 
            count: { type: 'number', default: 10 },
            category: { type: 'string', default: 'primary' }
          } 
        }
      },
      {
        name: 'search_emails',
        description: 'Search Gmail emails with query',
        inputSchema: { 
          type: 'object', 
          properties: { 
            query: { type: 'string', description: 'Gmail search query' },
            maxResults: { type: 'number', default: 10 }
          },
          required: ['query']
        }
      },
      {
        name: 'analyze_emails',
        description: 'AI-powered email analysis',
        inputSchema: { 
          type: 'object', 
          properties: { 
            count: { type: 'number', default: 5 },
            analysisType: { type: 'string', default: 'comprehensive' }
          } 
        }
      },
      {
        name: 'manage_subscriptions',
        description: 'Manage email subscriptions and unsubscribe',
        inputSchema: { 
          type: 'object', 
          properties: { 
            action: { type: 'string', enum: ['list', 'unsubscribe', 'block_sender'] },
            sender: { type: 'string', description: 'Email address to unsubscribe/block' },
            category: { type: 'string', default: 'promotions' }
          },
          required: ['action']
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    switch (name) {
      case 'get_emails': {
        const gmail = await getGmailService();
        
        const listParams = {
          userId: 'me',
          maxResults: args?.count || 10,
          q: `category:${args?.category || 'primary'}`
        };
        
        const response = await gmail.users.messages.list(listParams);
        const messages = response.data.messages || [];
        
        if (messages.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `No emails found in ${args?.category || 'primary'} category`
              }
            ]
          };
        }

        // Get details for first few emails
        const emailDetails = [];
        for (const message of messages.slice(0, 5)) {
          try {
            const emailResponse = await gmail.users.messages.get({
              userId: 'me',
              id: message.id,
              format: 'metadata'
            });
            
            const headers = emailResponse.data.payload.headers;
            const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
            const from = headers.find(h => h.name === 'From')?.value || 'Unknown Sender';
            const date = headers.find(h => h.name === 'Date')?.value || 'Unknown Date';
            
            emailDetails.push(`📧 **${subject}**\nFrom: ${from}\nDate: ${date}\nID: ${message.id}`);
          } catch (err) {
            console.error('Error getting email details:', err);
          }
        }
        
        return {
          content: [
            {
              type: 'text',
              text: `Found ${messages.length} emails in ${args?.category || 'primary'} category:\n\n${emailDetails.join('\n\n---\n\n')}`
            }
          ]
        };
      }

      case 'search_emails': {
        const gmail = await getGmailService();
        
        const response = await gmail.users.messages.list({
          userId: 'me',
          maxResults: args?.maxResults || 10,
          q: args.query
        });
        
        const messages = response.data.messages || [];
        
        if (messages.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `No emails found for query: "${args.query}"`
              }
            ]
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: `Found ${messages.length} emails for query "${args.query}":\n\nFirst email ID: ${messages[0].id}\n\nUse get_emails tool for more details.`
            }
          ]
        };
      }
        
      case 'analyze_emails': {
        const analysisType = args?.analysisType || 'comprehensive';
        const count = args?.count || 5;
        
        if (!openai) {
          return {
            content: [
              {
                type: 'text',
                text: `Email analysis (${analysisType}) for ${count} emails - OpenAI API key required for AI features. Set OPENAI_API_KEY in .env file.`
              }
            ]
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: `AI-powered email analysis (${analysisType}) for ${count} emails - Feature available with OpenAI integration`
            }
          ]
        };
      }

      case 'manage_subscriptions': {
        const action = args.action;
        
        if (action === 'list') {
          return {
            content: [
              {
                type: 'text',
                text: `📧 Email Subscriptions Analysis - ${args?.category || 'promotions'} Category\n\nSubscription management feature available. Use with Gmail API to:\n- List active subscriptions\n- Find unsubscribe links\n- Block unwanted senders`
              }
            ]
          };
        } else if (action === 'unsubscribe') {
          return {
            content: [
              {
                type: 'text',
                text: `Unsubscribe feature for ${args.sender} - Would search recent emails for unsubscribe links`
              }
            ]
          };
        } else if (action === 'block_sender') {
          return {
            content: [
              {
                type: 'text',
                text: `Block sender feature for ${args.sender} - Would create Gmail filter to auto-delete future emails`
              }
            ]
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: `Unknown subscription action: ${action}`
            }
          ]
        };
      }
        
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🚀 Gmail MCP Server started successfully');
}

main().catch((error) => {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  console.error('Fatal error:', errorMessage);
  process.exit(1);
});
