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
let openai: OpenAI | null = null;
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
async function loadSavedCredentialsIfExist(): Promise<OAuth2Client | null> {
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

async function authorizeGmail(): Promise<any> {
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

// Define types for tool arguments
interface GetEmailsArgs {
  count?: number;
  category?: string;
}

interface AnalyzeEmailsArgs {
  count?: number;
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

// Add basic Gmail tools
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
        name: 'analyze_emails',
        description: 'AI-powered email analysis',
        inputSchema: { 
          type: 'object', 
          properties: { 
            count: { type: 'number', default: 5 }
          } 
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
        const emailArgs = args as GetEmailsArgs;
        
        const listParams = {
          userId: 'me',
          maxResults: emailArgs?.count || 10,
          q: `category:${emailArgs?.category || 'primary'}`
        };
        
        const response = await gmail.users.messages.list(listParams);
        
        return {
          content: [
            {
              type: 'text',
              text: `Found ${response.data.messages?.length || 0} emails in ${emailArgs?.category || 'primary'} category`
            }
          ]
        };
      }
        
      case 'analyze_emails': {
        const analysisArgs = args as AnalyzeEmailsArgs;
        return {
          content: [
            {
              type: 'text',
              text: `Email analysis for ${analysisArgs?.count || 5} emails - OpenAI integration available with API key`
            }
          ]
        };
      }
        
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: unknown) {
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
  console.error('🚀 Gmail MCP Server started');
}

main().catch((error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  console.error('Fatal error:', errorMessage);
  process.exit(1);
});
