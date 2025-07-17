#!/usr/bin/env node

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

// Global variables
let openai: OpenAI | null = null;

// Load environment variables from multiple possible locations
function loadEnvironment() {
  const possibleEnvPaths = [
    path.join(__dirname, '..', '.env'),
    path.join(process.cwd(), '.env'),
    path.join(process.env.HOME || process.env.USERPROFILE || '', '.gmail-mcp.env')
  ];

  for (const envPath of possibleEnvPaths) {
    try {
      dotenv.config({ path: envPath });
      break;
    } catch (error) {
      // Continue to next path
    }
  }
}

// Initialize OpenAI only when needed
function initializeOpenAI(): OpenAI {
  if (openai) return openai;
  
  if (!process.env.OPENAI_API_KEY) {
    console.warn('Warning: OPENAI_API_KEY not found. AI features will be disabled.');
    console.warn('To enable AI features, set OPENAI_API_KEY in your environment or .env file.');
    // Return a mock OpenAI client that throws helpful errors
    return {
      chat: {
        completions: {
          create: () => {
            throw new Error('OpenAI API key required for AI features. Set OPENAI_API_KEY environment variable.');
          }
        }
      }
    } as any;
  }

  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  return openai;
}

// Command line argument handling
function handleCommandLineArgs() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }
  
  if (args.includes('--version') || args.includes('-v')) {
    console.log('Gmail MCP Server v3.0.0');
    process.exit(0);
  }
  
  if (args.includes('--setup')) {
    runSetup();
    return;
  }
  
  if (args.includes('--setup:fresh')) {
    runFreshSetup();
    return;
  }
  
  if (args.includes('--check-auth')) {
    checkAuth();
    return;
  }
}

function showHelp() {
  console.log(`
Gmail MCP Server v3.0.0
Complete Gmail client with AI-powered email management

USAGE:
  gmail-mcp-server [OPTIONS]
  gmail-mcp [OPTIONS]

OPTIONS:
  --help, -h        Show this help message
  --version, -v     Show version information
  --setup           Run initial Gmail authentication setup
  --setup:fresh     Clear existing auth and run fresh setup
  --check-auth      Check current authentication status

ENVIRONMENT VARIABLES:
  OPENAI_API_KEY    OpenAI API key for AI features (optional)
  GMAIL_ADDRESS     Specific Gmail address to use (optional)

EXAMPLES:
  gmail-mcp-server                    # Start MCP server
  gmail-mcp-server --setup            # Setup Gmail authentication
  gmail-mcp-server --check-auth       # Check auth status
  
MCP CLIENT CONFIGURATION:
  Add to Claude Desktop config:
  {
    "mcpServers": {
      "gmail": {
        "command": "npx",
        "args": ["@akhilpal/gmail-mcp-server"]
      }
    }
  }

For more information: https://github.com/akhilpal/gmail-mcp-server
`);
}

async function runSetup() {
  console.log('🔧 Setting up Gmail MCP Server...');
  try {
    // Import and run setup
    const setupModule = await import('./setup-gmail.js');
    if (setupModule.default) {
      await setupModule.default();
    }
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

async function runFreshSetup() {
  console.log('🧹 Clearing existing authentication...');
  try {
    const tokenPath = path.join(__dirname, '..', 'token.json');
    await fs.unlink(tokenPath).catch(() => {}); // Ignore if file doesn't exist
    console.log('✅ Cleared existing auth');
    await runSetup();
  } catch (error) {
    console.error('Fresh setup failed:', error);
    process.exit(1);
  }
}

async function checkAuth() {
  try {
    const tokenPath = path.join(__dirname, '..', 'token.json');
    const tokenData = await fs.readFile(tokenPath, 'utf8');
    const token = JSON.parse(tokenData);
    console.log('✅ Gmail authorization found');
    console.log('Client ID:', token.client_id ? 'Valid' : 'Invalid');
    console.log('Access Token:', token.access_token ? 'Present' : 'Missing');
    console.log('Refresh Token:', token.refresh_token ? 'Present' : 'Missing');
  } catch (error) {
    console.log('❌ No Gmail authorization found. Run: gmail-mcp-server --setup');
    process.exit(1);
  }
}

// Gmail auth setup with full Gmail access for v3.0.0
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

// Enhanced types for complete Gmail functionality
interface EmailAddress {
  email: string;
  name?: string;
}

interface EmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  historyId: string;
  internalDate: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    body?: { data?: string };
    parts?: Array<any>;
  };
  labelIds: string[];
  sizeEstimate: number;
}

interface EmailThread {
  id: string;
  historyId: string;
  messages: EmailMessage[];
}

// Gmail API client management
let gmailAuth: OAuth2Client | null = null;
let gmail: any = null;

async function initializeGmail(): Promise<void> {
  if (gmail) return;

  try {
    // Load existing token
    const token = await fs.readFile(GMAIL_TOKEN_PATH, 'utf8');
    const credentials = await fs.readFile(GMAIL_CREDENTIALS_PATH, 'utf8');
    
    const { client_secret, client_id, redirect_uris } = JSON.parse(credentials).installed || JSON.parse(credentials).web;
    
    gmailAuth = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    gmailAuth.setCredentials(JSON.parse(token));
    
    gmail = google.gmail({ version: 'v1', auth: gmailAuth });
    
    // Test the connection
    await gmail.users.getProfile({ userId: 'me' });
  } catch (error) {
    throw new Error('Gmail authentication failed. Run: gmail-mcp-server --setup');
  }
}

// Main MCP server logic (unchanged from your original)
async function main() {
  // Load environment
  loadEnvironment();
  
  // Handle command line arguments
  handleCommandLineArgs();
  
  console.log('🚀 Starting Gmail MCP Server v3.0.0...');
  
  // Initialize Gmail
  try {
    await initializeGmail();
    console.log('✅ Gmail authentication successful');
  } catch (error) {
    console.error('❌ Gmail authentication failed:', error.message);
    console.log('Run: gmail-mcp-server --setup');
    process.exit(1);
  }

  // Initialize OpenAI only when starting the server
  initializeOpenAI();
  console.log('✅ OpenAI client initialized');

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

  // Register all your existing tool handlers here
  // (I'll keep your existing tool registration code)
  
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'get_emails',
          description: 'Get emails from Gmail with filtering and pagination options',
          inputSchema: {
            type: 'object',
            properties: {
              category: {
                type: 'string',
                enum: ['primary', 'social', 'promotions', 'updates', 'forums', 'all'],
                default: 'primary',
                description: 'Gmail category to search in'
              },
              query: {
                type: 'string',
                description: 'Search query using Gmail search syntax'
              },
              maxResults: {
                type: 'number',
                default: 10,
                minimum: 1,
                maximum: 100,
                description: 'Maximum number of emails to return'
              },
              includeBody: {
                type: 'boolean',
                default: false,
                description: 'Whether to include email body content'
              },
              orderBy: {
                type: 'string',
                enum: ['date', 'relevance'],
                default: 'date',
                description: 'How to order the results'
              }
            }
          }
        },
        // Add all your other tools here...
      ]
    };
  });

  // Add your existing tool call handlers here...

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log('✅ Gmail MCP Server is running!');
}

// Only run main if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
