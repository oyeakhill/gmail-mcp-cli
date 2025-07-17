const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const { authenticate } = require('@google-cloud/local-auth');
const fs = require('fs').promises;
const path = require('path');

// Gmail auth paths
const GMAIL_TOKEN_PATH = path.join(__dirname, '..', 'token.json');
const GMAIL_CREDENTIALS_PATH = path.join(__dirname, '..', 'credentials.json');

const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.labels'
];

// Simple auth function
async function getAuth() {
  try {
    const tokenContent = await fs.readFile(GMAIL_TOKEN_PATH, 'utf-8');
    const credentials = JSON.parse(tokenContent);
    const { client_secret, client_id, refresh_token } = credentials;
    const client = new OAuth2Client(client_id, client_secret);
    client.setCredentials({ refresh_token });
    return client;
  } catch {
    return await authenticate({
      scopes: GMAIL_SCOPES,
      keyfilePath: GMAIL_CREDENTIALS_PATH,
    });
  }
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

// Tools list
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'get_emails',
      description: 'Get Gmail emails',
      inputSchema: {
        type: 'object',
        properties: {
          count: { type: 'number', default: 10 }
        }
      }
    }
  ]
}));

// Tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  if (name === 'get_emails') {
    try {
      const auth = await getAuth();
      const gmail = google.gmail({ version: 'v1', auth });
      const result = await gmail.users.messages.list({
        userId: 'me',
        maxResults: args?.count || 10
      });
      
      return {
        content: [{
          type: 'text',
          text: `Found ${result.data.messages?.length || 0} emails`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error: ${error.message || 'Unknown error'}`
        }]
      };
    }
  }
  
  throw new Error(`Unknown tool: ${name}`);
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Gmail MCP Server started');
}

main().catch(console.error);
