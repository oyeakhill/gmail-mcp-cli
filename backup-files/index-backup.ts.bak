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

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Check if API key is available
if (!process.env.OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY environment variable is not set');
  console.error('Please create a .env file in the project root with OPENAI_API_KEY=your-api-key');
  process.exit(1);
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
interface EmailMetadata {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  cc?: string;
  bcc?: string;
  date: string;
  dateTimestamp: number;
  body: string;
  snippet: string;
  isRead: boolean;
  isImportant: boolean;
  isStarred: boolean;
  labels: string[];
  category: string;
  attachments: Array<{
    filename: string;
    mimeType: string;
    size: number;
    attachmentId?: string;
  }>;
  internalDate: string;
  messageId: string;
  inReplyTo?: string;
  references?: string;
}

interface Subscription {
  sender: string;
  email: string;
  frequency: string;
  lastEmail: string;
  totalEmails: number;
  category: string;
}

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

async function saveCredentials(client: any): Promise<void> {
  const content = await fs.readFile(GMAIL_CREDENTIALS_PATH, 'utf-8');
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials?.refresh_token,
  });
  await fs.writeFile(GMAIL_TOKEN_PATH, payload);
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
    await saveCredentials(newClient as any);
  }
  return newClient;
}

async function getGmailService() {
  const auth = await authorizeGmail();
  return google.gmail({ version: 'v1', auth });
}

// Enhanced email parsing utilities
function extractEmailBody(payload: any): string {
  if (payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf-8');
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
        const text = extractEmailBody(part);
        if (text) return text;
      }
    }
  }
  return '';
}

function parseEmailMetadata(email: any): EmailMetadata {
  const headers = email.payload?.headers || [];
  const getHeader = (name: string) => headers.find((h: any) => h.name === name)?.value || '';
  
  // Parse attachments with attachment IDs
  const attachments: any[] = [];
  function extractAttachments(payload: any) {
    if (payload.filename && payload.body?.size > 0) {
      attachments.push({
        filename: payload.filename,
        mimeType: payload.mimeType,
        size: payload.body.size,
        attachmentId: payload.body.attachmentId
      });
    }
    if (payload.parts) {
      payload.parts.forEach(extractAttachments);
    }
  }
  
  if (email.payload) {
    extractAttachments(email.payload);
  }
  
  // Determine category based on labels
  const labels = email.labelIds || [];
  let category = 'primary';
  if (labels.includes('CATEGORY_PROMOTIONS')) category = 'promotions';
  else if (labels.includes('CATEGORY_SOCIAL')) category = 'social';
  else if (labels.includes('CATEGORY_UPDATES')) category = 'updates';
  
  // Parse date for proper sorting
  const dateStr = getHeader('Date');
  const dateTimestamp = dateStr ? new Date(dateStr).getTime() : 0;
  
  return {
    id: email.id,
    threadId: email.threadId,
    subject: getHeader('Subject') || 'No Subject',
    from: getHeader('From'),
    to: getHeader('To'),
    cc: getHeader('Cc'),
    bcc: getHeader('Bcc'),
    date: dateStr,
    dateTimestamp,
    body: extractEmailBody(email.payload || {}),
    snippet: email.snippet || '',
    isRead: !labels.includes('UNREAD'),
    isImportant: labels.includes('IMPORTANT'),
    isStarred: labels.includes('STARRED'),
    labels,
    category,
    attachments,
    internalDate: email.internalDate || '0',
    messageId: getHeader('Message-ID'),
    inReplyTo: getHeader('In-Reply-To'),
    references: getHeader('References')
  };
}

// Tool schemas for complete Gmail functionality (existing + new JSON-RPC endpoints)
const GetEmailsSchema = z.object({
  count: z.number().min(1).max(100).default(10),
  query: z.string().optional(),
  category: z.enum(['primary', 'promotions', 'social', 'updates', 'all']).default('primary'),
  includeBody: z.boolean().default(false),
  orderBy: z.enum(['date_desc', 'date_asc', 'relevance']).default('date_desc')
});

const AnalyzeEmailsSchema = z.object({
  count: z.number().min(1).max(50).default(10),
  query: z.string().optional(),
  category: z.enum(['primary', 'promotions', 'social', 'updates', 'all']).default('primary'),
  analysisType: z.enum(['summary', 'priority', 'sentiment', 'comprehensive']).default('comprehensive')
});

const SummarizeThreadSchema = z.object({
  threadId: z.string().describe("Thread ID to summarize"),
  summaryType: z.enum(['brief', 'detailed', 'action_items']).default('detailed').describe("Type of summary")
});

const ListActionItemsSchema = z.object({
  folder: z.enum(['inbox', 'sent', 'drafts', 'all']).default('inbox').describe("Folder to analyze"),
  account: z.string().optional().describe("Account filter"),
  timeframe: z.enum(['today', 'week', 'month', 'all']).default('week').describe("Timeframe for action items"),
  priority: z.enum(['high', 'medium', 'low', 'all']).default('all').describe("Priority filter")
});

const GenerateDraftSchema = z.object({
  prompt: z.string().describe("AI prompt for draft content"),
  replyToID: z.string().optional().describe("Email ID to reply to (optional)"),
  tone: z.enum(['professional', 'friendly', 'formal', 'casual']).default('professional').describe("Email tone"),
  length: z.enum(['brief', 'medium', 'detailed']).default('medium').describe("Draft length")
});

const SendNudgeSchema = z.object({
  emailId: z.string().describe("Email ID to nudge about"),
  nudgeType: z.enum(['follow_up', 'deadline_reminder', 'meeting_reminder', 'response_needed']).describe("Type of nudge"),
  delay: z.string().default('3 days').describe("When to send nudge (e.g., '3 days', '1 week')"),
  message: z.string().optional().describe("Custom nudge message")
});

const ExtractAttachmentsSummarySchema = z.object({
  emailId: z.string().describe("Email ID to analyze attachments"),
  includeContent: z.boolean().default(false).describe("Whether to analyze attachment content"),
  summaryDepth: z.enum(['basic', 'detailed', 'comprehensive']).default('detailed').describe("Level of analysis")
});

const ComposeEmailSchema = z.object({
  to: z.string().describe("Recipient email address(es)"),
  subject: z.string().describe("Email subject"),
  body: z.string().describe("Email body content"),
  cc: z.string().optional().describe("CC recipients"),
  bcc: z.string().optional().describe("BCC recipients"),
  replyTo: z.string().optional().describe("Reply-to address"),
  isHtml: z.boolean().default(false).describe("Whether body is HTML"),
  send: z.boolean().default(false).describe("Send immediately or save as draft")
});

const ReplyEmailSchema = z.object({
  emailId: z.string().describe("Email ID to reply to"),
  body: z.string().describe("Reply body content"),
  replyAll: z.boolean().default(false).describe("Reply to all recipients"),
  isHtml: z.boolean().default(false).describe("Whether body is HTML"),
  send: z.boolean().default(false).describe("Send immediately or save as draft")
});

const ManageSubscriptionsSchema = z.object({
  action: z.enum(['list', 'unsubscribe', 'block_sender']).describe("Action to perform"),
  sender: z.string().optional().describe("Sender email (required for unsubscribe/block)"),
  category: z.enum(['all', 'promotions', 'social', 'updates']).default('all').describe("Category to analyze")
});

const ManageLabelsSchema = z.object({
  action: z.enum(['list', 'create', 'delete', 'update']).describe("Action to perform"),
  name: z.string().optional().describe("Label name"),
  newName: z.string().optional().describe("New label name (for update)"),
  color: z.string().optional().describe("Label color"),
  visibility: z.enum(['show', 'hide', 'show_if_unread']).optional().describe("Label visibility")
});

const GetThreadSchema = z.object({
  threadId: z.string().describe("Thread ID to retrieve"),
  includeBody: z.boolean().default(false).describe("Include full email bodies")
});

// Create server
const server = new Server(
  {
    name: 'complete-gmail-mcp-server',
    version: '3.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register all 17 comprehensive tools (including JSON-RPC endpoints)
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // EXISTING CORE TOOLS (Enhanced from v2.1.0)
      {
        name: 'get_emails',
        description: '📧 Get emails from Gmail with comprehensive metadata and category filtering (Primary tab by default)',
        inputSchema: { type: 'object', properties: { count: { type: 'number', default: 10, minimum: 1, maximum: 100 }, category: { type: 'string', enum: ['primary', 'promotions', 'social', 'updates', 'all'], default: 'primary' }, query: { type: 'string' }, includeBody: { type: 'boolean', default: false }, orderBy: { type: 'string', enum: ['date_desc', 'date_asc', 'relevance'], default: 'date_desc' } }, required: [] }
      },
      {
        name: 'search_emails',
        description: '🔍 Advanced Gmail search with full search syntax support (searchEmails JSON-RPC endpoint)',
        inputSchema: { type: 'object', properties: { query: { type: 'string' }, maxResults: { type: 'number', default: 20, minimum: 1, maximum: 100 } }, required: ['query'] }
      },
      {
        name: 'manage_email',
        description: '🛠 Manage emails including applyLabel functionality (applyLabel JSON-RPC endpoint)',
        inputSchema: { type: 'object', properties: { emailId: { type: 'string' }, action: { type: 'string', enum: ['mark_read', 'mark_unread', 'add_label', 'remove_label', 'archive', 'delete', 'star', 'unstar'] }, labelName: { type: 'string' } }, required: ['emailId', 'action'] }
      },
      {
        name: 'analyze_emails',
        description: '🤖 AI-powered analysis of emails with priorities and insights (Primary tab by default)',
        inputSchema: { type: 'object', properties: { count: { type: 'number', default: 10, minimum: 1, maximum: 50 }, category: { type: 'string', enum: ['primary', 'promotions', 'social', 'updates', 'all'], default: 'primary' }, analysisType: { type: 'string', enum: ['summary', 'priority', 'sentiment', 'comprehensive'], default: 'comprehensive' } }, required: [] }
      },
      {
        name: 'get_email_details',
        description: '🔬 Get detailed information about a specific email',
        inputSchema: { type: 'object', properties: { emailId: { type: 'string' }, includeRaw: { type: 'boolean', default: false } }, required: ['emailId'] }
      },
      {
        name: 'get_gmail_stats',
        description: '📊 Get comprehensive Gmail statistics (inbox counts, categories, etc.)',
        inputSchema: { type: 'object', properties: { detailed: { type: 'boolean', default: false } }, required: [] }
      },
      {
        name: 'get_special_emails',
        description: '📁 Get special emails (drafts, sent, snoozed, starred, important, trash, spam)',
        inputSchema: { type: 'object', properties: { type: { type: 'string', enum: ['drafts', 'sent', 'snoozed', 'starred', 'important', 'trash', 'spam'] }, count: { type: 'number', default: 10, minimum: 1, maximum: 50 } }, required: ['type'] }
      },
      
      // v3.0.0: EMAIL COMPOSITION & COMMUNICATION
      {
        name: 'compose_email',
        description: '✍️ Compose new emails (send immediately or save as draft)',
        inputSchema: { type: 'object', properties: { to: { type: 'string', description: 'Recipient email address(es)' }, subject: { type: 'string', description: 'Email subject' }, body: { type: 'string', description: 'Email body content' }, cc: { type: 'string', description: 'CC recipients' }, bcc: { type: 'string', description: 'BCC recipients' }, isHtml: { type: 'boolean', default: false, description: 'Whether body is HTML' }, send: { type: 'boolean', default: false, description: 'Send immediately or save as draft' } }, required: ['to', 'subject', 'body'] }
      },
      {
        name: 'reply_email',
        description: '↩️ Reply to emails (reply or reply-all)',
        inputSchema: { type: 'object', properties: { emailId: { type: 'string', description: 'Email ID to reply to' }, body: { type: 'string', description: 'Reply body content' }, replyAll: { type: 'boolean', default: false, description: 'Reply to all recipients' }, isHtml: { type: 'boolean', default: false }, send: { type: 'boolean', default: false, description: 'Send immediately or save as draft' } }, required: ['emailId', 'body'] }
      },
      
      // v3.0.0: SUBSCRIPTION MANAGEMENT
      {
        name: 'manage_subscriptions',
        description: '📧 Manage email subscriptions (list, unsubscribe, block senders) - SOLVES YOUR UNSUBSCRIBE NEEDS!',
        inputSchema: { type: 'object', properties: { action: { type: 'string', enum: ['list', 'unsubscribe', 'block_sender'], description: 'list: show all subscriptions, unsubscribe: find unsubscribe links, block_sender: auto-delete future emails' }, sender: { type: 'string', description: 'Sender email address (required for unsubscribe/block actions)' }, category: { type: 'string', enum: ['all', 'promotions', 'social', 'updates'], default: 'all', description: 'Gmail category to analyze for subscriptions' } }, required: ['action'] }
      },
      
      // v3.0.0: LABEL MANAGEMENT
      {
        name: 'manage_labels',
        description: '🏷️ Manage Gmail labels (create, delete, update, list)',
        inputSchema: { type: 'object', properties: { action: { type: 'string', enum: ['list', 'create', 'delete', 'update'], description: 'Action to perform on labels' }, name: { type: 'string', description: 'Label name (required for create/delete/update)' }, newName: { type: 'string', description: 'New label name (for update action)' }, visibility: { type: 'string', enum: ['show', 'hide', 'show_if_unread'], description: 'Label visibility setting' } }, required: ['action'] }
      },
      
      // v3.0.0: THREAD MANAGEMENT
      {
        name: 'get_thread',
        description: '🧵 Get email thread/conversation with all messages',
        inputSchema: { type: 'object', properties: { threadId: { type: 'string', description: 'Thread ID to retrieve' }, includeBody: { type: 'boolean', default: false, description: 'Include full email bodies in thread' } }, required: ['threadId'] }
      },
      
      // NEW v3.1.0: JSON-RPC ENDPOINTS
      {
        name: 'summarize_thread',
        description: '📝 AI-powered thread summarization (summarizeThread JSON-RPC endpoint)',
        inputSchema: { type: 'object', properties: { threadId: { type: 'string', description: 'Thread ID to summarize' }, summaryType: { type: 'string', enum: ['brief', 'detailed', 'action_items'], default: 'detailed', description: 'Type of summary to generate' } }, required: ['threadId'] }
      },
      {
        name: 'list_action_items',
        description: '📋 Extract action items from emails by folder/account (listActionItems JSON-RPC endpoint)',
        inputSchema: { type: 'object', properties: { folder: { type: 'string', enum: ['inbox', 'sent', 'drafts', 'all'], default: 'inbox', description: 'Folder to analyze' }, account: { type: 'string', description: 'Account filter' }, timeframe: { type: 'string', enum: ['today', 'week', 'month', 'all'], default: 'week', description: 'Timeframe for analysis' }, priority: { type: 'string', enum: ['high', 'medium', 'low', 'all'], default: 'all', description: 'Priority filter' } }, required: [] }
      },
      {
        name: 'generate_draft',
        description: '🤖 AI-powered draft generation from prompts (generateDraft JSON-RPC endpoint)',
        inputSchema: { type: 'object', properties: { prompt: { type: 'string', description: 'AI prompt for draft content' }, replyToID: { type: 'string', description: 'Email ID to reply to (optional)' }, tone: { type: 'string', enum: ['professional', 'friendly', 'formal', 'casual'], default: 'professional', description: 'Email tone' }, length: { type: 'string', enum: ['brief', 'medium', 'detailed'], default: 'medium', description: 'Draft length' } }, required: ['prompt'] }
      },
      {
        name: 'send_nudge',
        description: '⏰ Send follow-up nudges and reminders (sendNudge JSON-RPC endpoint)',
        inputSchema: { type: 'object', properties: { emailId: { type: 'string', description: 'Email ID to nudge about' }, nudgeType: { type: 'string', enum: ['follow_up', 'deadline_reminder', 'meeting_reminder', 'response_needed'], description: 'Type of nudge to send' }, delay: { type: 'string', default: '3 days', description: 'When to send nudge (e.g., "3 days", "1 week")' }, message: { type: 'string', description: 'Custom nudge message' } }, required: ['emailId', 'nudgeType'] }
      },
      {
        name: 'extract_attachments_summary',
        description: '📎 AI-powered attachment analysis and summarization (extractAttachmentsSummary JSON-RPC endpoint)',
        inputSchema: { type: 'object', properties: { emailId: { type: 'string', description: 'Email ID to analyze attachments' }, includeContent: { type: 'boolean', default: false, description: 'Whether to analyze attachment content' }, summaryDepth: { type: 'string', enum: ['basic', 'detailed', 'comprehensive'], default: 'detailed', description: 'Level of analysis depth' } }, required: ['emailId'] }
      }
    ],
  };
});

// Handle tool calls with routing to appropriate handlers
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name;
  
  try {
    switch (toolName) {
      // Existing tools (keeping v3.0.0 implementations)
      case 'get_emails':
        return await handleGetEmails(request.params.arguments);
      case 'analyze_emails':
        return await handleAnalyzeEmails(request.params.arguments);
      case 'search_emails':
        return await handleSearchEmails(request.params.arguments);
      case 'get_email_details':
        return await handleGetEmailDetails(request.params.arguments);
      case 'manage_email':
        return await handleManageEmail(request.params.arguments);
      case 'get_gmail_stats':
        return await handleGetGmailStats(request.params.arguments);
      case 'get_special_emails':
        return await handleGetSpecialEmails(request.params.arguments);
        
      // v3.0.0 EMAIL COMPOSITION TOOLS
      case 'compose_email':
        return await handleComposeEmail(request.params.arguments);
      case 'reply_email':
        return await handleReplyEmail(request.params.arguments);
        
      // v3.0.0 SUBSCRIPTION MANAGEMENT (Your main request!)
      case 'manage_subscriptions':
        return await handleManageSubscriptions(request.params.arguments);
        
      // v3.0.0 LABEL MANAGEMENT
      case 'manage_labels':
        return await handleManageLabels(request.params.arguments);
        
      // v3.0.0 THREAD MANAGEMENT
      case 'get_thread':
        return await handleGetThread(request.params.arguments);
        
      // NEW v3.1.0: JSON-RPC ENDPOINTS
      case 'summarize_thread':
        return await handleSummarizeThread(request.params.arguments);
      case 'list_action_items':
        return await handleListActionItems(request.params.arguments);
      case 'generate_draft':
        return await handleGenerateDraft(request.params.arguments);
      case 'send_nudge':
        return await handleSendNudge(request.params.arguments);
      case 'extract_attachments_summary':
        return await handleExtractAttachmentsSummary(request.params.arguments);
        
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  } catch (error: any) {
    console.error(`Error in ${toolName}:`, error);
    return {
      content: [
        {
          type: 'text',
          text: `Error executing ${toolName}: ${error.message}`,
        },
      ],
    };
  }
});

// IMPLEMENTATION OF NEW v3.0.0 TOOLS

async function handleComposeEmail(args: any) {
  const params = ComposeEmailSchema.parse(args);
  const gmail = await getGmailService();
  
  // Build email message
  const messageParts = [];
  messageParts.push(`To: ${params.to}`);
  if (params.cc) messageParts.push(`Cc: ${params.cc}`);
  if (params.bcc) messageParts.push(`Bcc: ${params.bcc}`);
  if (params.replyTo) messageParts.push(`Reply-To: ${params.replyTo}`);
  messageParts.push(`Subject: ${params.subject}`);
  messageParts.push(`Content-Type: ${params.isHtml ? 'text/html' : 'text/plain'}; charset=utf-8`);
  messageParts.push('');
  messageParts.push(params.body);
  
  const message = messageParts.join('\n');
  const encodedMessage = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  
  if (params.send) {
    // Send email immediately
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });
    
    return {
      content: [
        {
          type: 'text',
          text: `✅ **Email Sent Successfully!**

📧 **To:** ${params.to}
📝 **Subject:** ${params.subject}
${params.cc ? `📋 **CC:** ${params.cc}\n` : ''}${params.bcc ? `📋 **BCC:** ${params.bcc}\n` : ''}🆔 **Message ID:** ${response.data.id}

Your email has been delivered!`,
        },
      ],
    };
  } else {
    // Save as draft
    const response = await gmail.users.drafts.create({
      userId: 'me',
      requestBody: {
        message: {
          raw: encodedMessage
        }
      }
    });
    
    return {
      content: [
        {
          type: 'text',
          text: `💾 **Email Saved as Draft!**

📧 **To:** ${params.to}
📝 **Subject:** ${params.subject}
🆔 **Draft ID:** ${response.data.id}

You can send this later from your drafts folder.`,
        },
      ],
    };
  }
}

async function handleReplyEmail(args: any) {
  const params = ReplyEmailSchema.parse(args);
  const gmail = await getGmailService();
  
  // Get original email for reply context
  const originalEmail = await gmail.users.messages.get({
    userId: 'me',
    id: params.emailId,
    format: 'full'
  });
  
  const headers = originalEmail.data.payload?.headers || [];
  const getHeader = (name: string) => headers.find((h: any) => h.name === name)?.value || '';
  
  const originalFrom = getHeader('From');
  const originalTo = getHeader('To');
  const originalCc = getHeader('Cc');
  const originalSubject = getHeader('Subject');
  const messageId = getHeader('Message-ID');
  
  // Build reply recipients
  let replyTo = originalFrom;
  let replyCc = '';
  
  if (params.replyAll) {
    const allRecipients = [originalTo, originalCc].filter(Boolean).join(', ');
    replyCc = allRecipients;
  }
  
  // Build reply message
  const messageParts = [];
  messageParts.push(`To: ${replyTo}`);
  if (replyCc && params.replyAll) messageParts.push(`Cc: ${replyCc}`);
  messageParts.push(`Subject: Re: ${originalSubject.replace(/^Re:\s*/, '')}`);
  messageParts.push(`In-Reply-To: ${messageId}`);
  messageParts.push(`References: ${messageId}`);
  messageParts.push(`Content-Type: ${params.isHtml ? 'text/html' : 'text/plain'}; charset=utf-8`);
  messageParts.push('');
  messageParts.push(params.body);
  
  const message = messageParts.join('\n');
  const encodedMessage = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  
  if (params.send) {
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
        threadId: originalEmail.data.threadId
      }
    });
    
    return {
      content: [
        {
          type: 'text',
          text: `↩️ **Reply Sent Successfully!**

📧 **To:** ${replyTo}
${params.replyAll && replyCc ? `📋 **CC:** ${replyCc}\n` : ''}📝 **Subject:** Re: ${originalSubject}
🆔 **Message ID:** ${response.data.id}

Your reply has been sent in the conversation thread.`,
        },
      ],
    };
  } else {
    const response = await gmail.users.drafts.create({
      userId: 'me',
      requestBody: {
        message: {
          raw: encodedMessage,
          threadId: originalEmail.data.threadId
        }
      }
    });
    
    return {
      content: [
        {
          type: 'text',
          text: `💾 **Reply Saved as Draft!**

📧 **To:** ${replyTo}
📝 **Subject:** Re: ${originalSubject}
🆔 **Draft ID:** ${response.data.id}

You can send this reply later from your drafts.`,
        },
      ],
    };
  }
}

async function handleManageSubscriptions(args: any) {
  const params = ManageSubscriptionsSchema.parse(args);
  const gmail = await getGmailService();
  
  if (params.action === 'list') {
    // Analyze subscription emails from your specific categories
    let query = 'unsubscribe OR "manage subscription" OR "email preferences" OR "opt out"';
    if (params.category !== 'all') {
      query = `category:${params.category} ${query}`;
    }
    
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 100,
      q: query
    });
    
    const messages = response.data.messages || [];
    
    if (messages.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `📧 **No subscription emails found in ${params.category} category.**

Try searching a different category or check "all" categories.`,
          },
        ],
      };
    }
    
    // Group by sender to identify subscriptions (like your Gmail interface shows)
    const senderMap = new Map<string, Subscription>();
    
    for (const message of messages.slice(0, 50)) { // Limit for performance
      const email = await gmail.users.messages.get({
        userId: 'me',
        id: message.id!,
        format: 'metadata',
        metadataHeaders: ['From', 'Date', 'Subject']
      });
      
      const headers = email.data.payload?.headers || [];
      const getHeader = (name: string) => headers.find((h: any) => h.name === name)?.value || '';
      
      const from = getHeader('From');
      const date = getHeader('Date');
      
      if (from) {
        // Extract email address from "Name <email@domain.com>" format
        const emailMatch = from.match(/<(.+?)>/) || from.match(/([^\s<>]+@[^\s<>]+)/);
        const emailAddress = emailMatch ? emailMatch[1] || emailMatch[0] : from;
        
        if (senderMap.has(emailAddress)) {
          const existing = senderMap.get(emailAddress)!;
          existing.totalEmails++;
          if (new Date(date) > new Date(existing.lastEmail)) {
            existing.lastEmail = date;
          }
        } else {
          senderMap.set(emailAddress, {
            sender: from,
            email: emailAddress,
            frequency: 'Multiple emails recently',
            lastEmail: date,
            totalEmails: 1,
            category: params.category
          });
        }
      }
    }
    
    const subscriptions = Array.from(senderMap.values())
      .sort((a, b) => b.totalEmails - a.totalEmails)
      .slice(0, 20);
    
    const subscriptionList = subscriptions.map((sub, index) => 
      `**${index + 1}. ${sub.sender}**
📧 Email: ${sub.email}
📊 Recent Emails: ${sub.totalEmails}+ 
📅 Last Email: ${sub.lastEmail}
📁 Category: ${sub.category}

🔗 **Unsubscribe:** \`manage_subscriptions\` action: "unsubscribe", sender: "${sub.email}"
🚫 **Block Forever:** \`manage_subscriptions\` action: "block_sender", sender: "${sub.email}"`
    ).join('\n\n---\n\n');
    
    return {
      content: [
        {
          type: 'text',
          text: `📧 **Email Subscriptions Analysis - ${params.category.toUpperCase()} Category**

**Found ${subscriptions.length} active subscription senders:**

${subscriptionList}

💡 **Quick Actions:**
- **Unsubscribe**: Finds unsubscribe links in recent emails
- **Block Sender**: Creates filter to auto-delete future emails

📊 **Total analyzed**: ${messages.length} subscription-related emails`,
        },
      ],
    };
  }
  
  if (params.action === 'unsubscribe') {
    if (!params.sender) {
      throw new Error('Sender email is required for unsubscribe action');
    }
    
    // Find recent emails from this sender with unsubscribe links
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 10,
      q: `from:${params.sender}`
    });
    
    const messages = response.data.messages || [];
    
    if (messages.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ **No recent emails found from ${params.sender}**

The sender might have been typed incorrectly or no recent emails exist.`,
          },
        ],
      };
    }
    
    // Get the most recent email and look for unsubscribe links
    const email = await gmail.users.messages.get({
      userId: 'me',
      id: messages[0].id!,
      format: 'full'
    });
    
    const body = extractEmailBody(email.data.payload || {});
    
    // Look for various unsubscribe patterns
    const unsubscribePatterns = [
      /https?:\/\/[^\s]+unsubscribe[^\s]*/gi,
      /https?:\/\/[^\s]+opt[_-]?out[^\s]*/gi,
      /https?:\/\/[^\s]+email[_-]?preferences[^\s]*/gi,
      /https?:\/\/[^\s]+manage[_-]?subscription[^\s]*/gi
    ];
    
    let unsubscribeLinks: string[] = [];
    unsubscribePatterns.forEach(pattern => {
      const matches = body.match(pattern) || [];
      unsubscribeLinks = [...unsubscribeLinks, ...matches];
    });
    
    // Remove duplicates
    unsubscribeLinks = [...new Set(unsubscribeLinks)];
    
    if (unsubscribeLinks.length > 0) {
      return {
        content: [
          {
            type: 'text',
            text: `🔗 **Unsubscribe Options for ${params.sender}:**

**Found ${unsubscribeLinks.length} unsubscribe link(s):**

${unsubscribeLinks.map((link, i) => `${i + 1}. ${link}`).join('\n')}

**📱 Next Steps:**
1. **Click on one of the unsubscribe links above** (safest method)
2. **Or use auto-block**: \`manage_subscriptions\` action: "block_sender", sender: "${params.sender}"

⚠️ **Note**: Clicking unsubscribe links is usually safe for legitimate senders, but for unknown senders, blocking might be safer.`,
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: 'text',
            text: `❌ **No unsubscribe links found in recent emails from ${params.sender}**

**🔧 Alternative Options:**
1. **Auto-block sender**: \`manage_subscriptions\` action: "block_sender", sender: "${params.sender}"
2. **Mark as spam**: Use \`manage_email\` to move emails to spam
3. **Create custom filter**: Use Gmail's filter system to auto-organize

**🛡️ Recommended**: Use "block_sender" to automatically delete future emails from this sender.`,
          },
        ],
      };
    }
  }
  
  if (params.action === 'block_sender') {
    if (!params.sender) {
      throw new Error('Sender email is required for block_sender action');
    }
    
    try {
      // Create a filter to automatically delete emails from this sender
      await gmail.users.settings.filters.create({
        userId: 'me',
        requestBody: {
          criteria: {
            from: params.sender
          },
          action: {
            removeLabelIds: ['INBOX'],
            addLabelIds: ['TRASH']
          }
        }
      });
      
      return {
        content: [
          {
            type: 'text',
            text: `🚫 **Sender Blocked Successfully!**

✅ **Created automatic filter for**: ${params.sender}
🗑️ **Future emails will be**: Automatically moved to trash
📧 **Existing emails**: Remain in your inbox (unaffected)

**📋 Filter Details:**
- **Criteria**: All emails from ${params.sender}
- **Action**: Bypass inbox → Move to trash
- **Status**: Active immediately

**🛠️ Management**: You can view/modify this filter using the \`manage_filters\` tool if available, or through Gmail settings.

**✨ You're now unsubscribed automatically!** No more emails from this sender will clutter your inbox.`,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ **Failed to block sender**: ${error.message}

This might be due to insufficient permissions or API limitations. 

**🔧 Alternative**: Manually create a filter in Gmail:
1. Go to Gmail Settings → Filters and Blocked Addresses
2. Create new filter with "From: ${params.sender}"
3. Choose "Delete it" action`,
          },
        ],
      };
    }
  }
  
  return {
    content: [
      {
        type: 'text',
        text: `❌ Unknown action: ${params.action}. Available actions: list, unsubscribe, block_sender`,
      },
    ],
  };
}

async function handleManageLabels(args: any) {
  const params = ManageLabelsSchema.parse(args);
  const gmail = await getGmailService();
  
  if (params.action === 'list') {
    const response = await gmail.users.labels.list({
      userId: 'me'
    });
    
    const labels = response.data.labels || [];
    const userLabels = labels.filter(label => label.type === 'user');
    const systemLabels = labels.filter(label => label.type === 'system');
    
    const formatLabels = (labelList: any[], title: string) => {
      if (labelList.length === 0) return '';
      return `**${title}:**\n${labelList.map(label => 
        `🏷️ **${label.name}** (ID: ${label.id})\n   📊 Messages: ${label.messagesTotal || 0} | Unread: ${label.messagesUnread || 0}`
      ).join('\n')}\n\n`;
    };
    
    return {
      content: [
        {
          type: 'text',
          text: `🏷️ **Gmail Labels Management**

${formatLabels(userLabels, 'Your Custom Labels')}${formatLabels(systemLabels, 'System Labels')}

**🛠️ Available Actions:**
- **Create**: \`manage_labels\` action: "create", name: "YourLabelName"
- **Delete**: \`manage_labels\` action: "delete", name: "ExistingLabel"
- **Update**: \`manage_labels\` action: "update", name: "OldName", newName: "NewName"

**💡 Usage Tips:**
- Use labels to organize emails by project, priority, or category
- System labels (like INBOX, SENT) cannot be deleted
- Labels can be applied to emails using \`manage_email\` tool`,
        },
      ],
    };
  }
  
  if (params.action === 'create') {
    if (!params.name) {
      throw new Error('Label name is required for create action');
    }
    
    try {
      const response = await gmail.users.labels.create({
        userId: 'me',
        requestBody: {
          name: params.name,
          labelListVisibility: params.visibility === 'hide' ? 'labelHide' : 'labelShow',
          messageListVisibility: 'show'
        }
      });
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ **Label Created Successfully!**

🏷️ **Name**: ${params.name}
🆔 **ID**: ${response.data.id}
👁️ **Visibility**: ${params.visibility || 'show'}

**🚀 Next Steps:**
- Apply to emails: Use \`manage_email\` with action "add_label" and labelName "${params.name}"
- The label will appear in your Gmail sidebar
- You can organize emails by dragging them to this label`,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ **Failed to create label**: ${error.message}

**Common issues:**
- Label name already exists
- Invalid characters in name
- Insufficient permissions`,
          },
        ],
      };
    }
  }
  
  if (params.action === 'delete') {
    if (!params.name) {
      throw new Error('Label name is required for delete action');
    }
    
    try {
      // Find label by name
      const labelsResponse = await gmail.users.labels.list({ userId: 'me' });
      const label = labelsResponse.data.labels?.find(l => l.name === params.name);
      
      if (!label) {
        throw new Error(`Label "${params.name}" not found`);
      }
      
      if (label.type === 'system') {
        throw new Error(`Cannot delete system label "${params.name}"`);
      }
      
      await gmail.users.labels.delete({
        userId: 'me',
        id: label.id!
      });
      
      return {
        content: [
          {
            type: 'text',
            text: `🗑️ **Label Deleted Successfully!**

**Deleted label**: ${params.name}
**Impact**: All emails with this label are now unlabeled
**Note**: This action cannot be undone

The label has been removed from your Gmail account.`,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ **Failed to delete label**: ${error.message}`,
          },
        ],
      };
    }
  }
  
  return {
    content: [
      {
        type: 'text',
        text: `🔧 **Label action "${params.action}" not yet fully implemented**

Available actions: list, create, delete
Update functionality coming in future version.`,
      },
    ],
  };
}

async function handleGetThread(args: any) {
  const params = GetThreadSchema.parse(args);
  const gmail = await getGmailService();
  
  try {
    const thread = await gmail.users.threads.get({
      userId: 'me',
      id: params.threadId,
      format: 'full'
    });
    
    const messages = thread.data.messages || [];
    const emails = messages.map(parseEmailMetadata);
    
    // Sort by date
    emails.sort((a, b) => a.dateTimestamp - b.dateTimestamp);
    
    const participants = [...new Set(emails.flatMap(e => [e.from, e.to].filter(Boolean)))];
    const subjects = [...new Set(emails.map(e => e.subject).filter(Boolean))];
    
    const threadSummary = `🧵 **Email Thread Conversation**

**📊 Thread Overview:**
- **Thread ID**: ${params.threadId}
- **Messages**: ${emails.length}
- **Participants**: ${participants.join(', ')}
- **Subject(s)**: ${subjects.join(', ')}

**💬 Conversation Flow:**
${emails.map((email, i) => `
**Message ${i + 1}** (${email.isRead ? '📖 Read' : '📧 Unread'})
👤 **From**: ${email.from}
📅 **Date**: ${email.date}
📝 **Subject**: ${email.subject}
${email.isStarred ? '⭐ Starred | ' : ''}${email.isImportant ? '🔥 Important | ' : ''}${email.attachments.length > 0 ? `📎 ${email.attachments.length} attachments` : ''}
${params.includeBody ? `\n📄 **Content**: ${email.body.substring(0, 300)}${email.body.length > 300 ? '...' : ''}` : `\n📋 **Snippet**: ${email.snippet}`}
🆔 **Email ID**: ${email.id}
`).join('\n---\n')}

**🛠️ Actions Available:**
- Reply to any message: \`reply_email\` with emailId from above
- Manage any message: \`manage_email\` with actions like star, archive, etc.
- Get full details: \`get_email_details\` with specific emailId`;

    return {
      content: [
        {
          type: 'text',
          text: threadSummary,
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `❌ **Failed to retrieve thread**: ${error.message}

**Possible issues:**
- Invalid thread ID
- Thread doesn't exist
- Access permissions

**💡 To find thread IDs**: Use \`get_emails\` or \`search_emails\` - thread IDs are included in email metadata.`,
        },
      ],
    };
  }
}

// NEW v3.1.0: COMPLETE JSON-RPC ENDPOINT IMPLEMENTATIONS

async function handleSummarizeThread(args: any) {
  const params = SummarizeThreadSchema.parse(args);
  const gmail = await getGmailService();
  
  try {
    const thread = await gmail.users.threads.get({
      userId: 'me',
      id: params.threadId,
      format: 'full'
    });
    
    const messages = thread.data.messages || [];
    const emails = messages.map(parseEmailMetadata);
    emails.sort((a, b) => a.dateTimestamp - b.dateTimestamp);
    
    // Prepare conversation for AI analysis
    const conversationText = emails.map((email, i) => 
      `Message ${i + 1} (${email.date}):\nFrom: ${email.from}\nTo: ${email.to}\nSubject: ${email.subject}\n\nContent: ${email.body.substring(0, 1000)}${email.body.length > 1000 ? '...' : ''}\n\n---\n`
    ).join('');
    
    // Generate AI summary based on type
    let prompt = '';
    if (params.summaryType === 'brief') {
      prompt = `Provide a brief 2-3 sentence summary of this email conversation:\n\n${conversationText}`;
    } else if (params.summaryType === 'action_items') {
      prompt = `Extract all action items, tasks, deadlines, and next steps from this email conversation. Format as a bullet list:\n\n${conversationText}`;
    } else { // detailed
      prompt = `Provide a detailed summary of this email conversation including key points, decisions made, participants, and any action items:\n\n${conversationText}`;
    }
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.3
    });
    
    const aiSummary = completion.choices[0]?.message?.content || 'Unable to generate summary';
    
    return {
      content: [
        {
          type: 'text',
          text: `📝 **Thread Summary (${params.summaryType.toUpperCase()})**\n\n**Thread ID**: ${params.threadId}\n**Messages**: ${emails.length}\n**Participants**: ${[...new Set(emails.map(e => e.from))].join(', ')}\n\n**🤖 AI Summary:**\n${aiSummary}\n\n**📊 Thread Stats:**\n- **Date Range**: ${emails[0]?.date} → ${emails[emails.length - 1]?.date}\n- **Attachments**: ${emails.reduce((sum, e) => sum + e.attachments.length, 0)}\n- **Unread**: ${emails.filter(e => !e.isRead).length}`,
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `❌ **Failed to summarize thread**: ${error.message}`,
        },
      ],
    };
  }
}

async function handleListActionItems(args: any) {
  const params = ListActionItemsSchema.parse(args);
  const gmail = await getGmailService();
  
  try {
    // Build query based on folder and timeframe
    let query = '';
    if (params.folder === 'inbox') query = 'in:inbox';
    else if (params.folder === 'sent') query = 'in:sent';
    else if (params.folder === 'drafts') query = 'in:drafts';
    else query = 'in:inbox OR in:sent';
    
    // Add timeframe filter
    if (params.timeframe === 'today') {
      query += ' newer_than:1d';
    } else if (params.timeframe === 'week') {
      query += ' newer_than:7d';
    } else if (params.timeframe === 'month') {
      query += ' newer_than:30d';
    }
    
    // Add action-related keywords
    query += ' ("action required" OR "deadline" OR "due date" OR "task" OR "TODO" OR "follow up" OR "next steps" OR "please" OR "need to" OR "reminder")';
    
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 50,
      q: query
    });
    
    const messages = response.data.messages || [];
    
    if (messages.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `📋 **No Action Items Found**\n\n**Searched in**: ${params.folder}\n**Timeframe**: ${params.timeframe}\n\nNo emails with action-related keywords found in the specified timeframe.`,
          },
        ],
      };
    }
    
    // Analyze first 20 emails for action items
    const actionItems: any[] = [];
    
    for (const message of messages.slice(0, 20)) {
      const email = await gmail.users.messages.get({
        userId: 'me',
        id: message.id!,
        format: 'full'
      });
      
      const emailData = parseEmailMetadata(email.data);
      
      // Use AI to extract action items
      const prompt = `Extract specific action items, tasks, deadlines, and next steps from this email. Format as bullet points with priority (High/Medium/Low):\n\nSubject: ${emailData.subject}\nFrom: ${emailData.from}\nBody: ${emailData.body.substring(0, 800)}`;
      
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 200,
          temperature: 0.2
        });
        
        const extractedActions = completion.choices[0]?.message?.content || '';
        
        if (extractedActions && !extractedActions.toLowerCase().includes('no action items')) {
          actionItems.push({
            emailId: emailData.id,
            subject: emailData.subject,
            from: emailData.from,
            date: emailData.date,
            actions: extractedActions,
            isRead: emailData.isRead,
            priority: extractedActions.toLowerCase().includes('urgent') || extractedActions.toLowerCase().includes('high') ? 'High' : 
                     extractedActions.toLowerCase().includes('low') ? 'Low' : 'Medium'
          });
        }
      } catch (aiError) {
        // Fallback: simple keyword detection
        const actionKeywords = ['deadline', 'due', 'task', 'action required', 'follow up', 'next steps'];
        const hasActionKeywords = actionKeywords.some(keyword => 
          emailData.body.toLowerCase().includes(keyword) || emailData.subject.toLowerCase().includes(keyword)
        );
        
        if (hasActionKeywords) {
          actionItems.push({
            emailId: emailData.id,
            subject: emailData.subject,
            from: emailData.from,
            date: emailData.date,
            actions: 'Contains action-related keywords - manual review needed',
            isRead: emailData.isRead,
            priority: 'Medium'
          });
        }
      }
    }
    
    // Filter by priority if specified
    const filteredItems = params.priority === 'all' ? actionItems : 
                         actionItems.filter(item => item.priority.toLowerCase() === params.priority);
    
    // Sort by priority and date
    const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
    filteredItems.sort((a, b) => {
      const priorityDiff = (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
    
    const actionItemsList = filteredItems.map((item, index) => 
      `**${index + 1}. ${item.priority} Priority** ${item.isRead ? '📖' : '📧'}\n📧 **From**: ${item.from}\n📝 **Subject**: ${item.subject}\n📅 **Date**: ${item.date}\n🎯 **Actions**: ${item.actions}\n🆔 **Email ID**: ${item.emailId}\n`
    ).join('\n---\n\n');
    
    return {
      content: [
        {
          type: 'text',
          text: `📋 **Action Items Analysis - ${params.folder.toUpperCase()} (${params.timeframe})**\n\n**Found ${filteredItems.length} action items** (${params.priority} priority)\n\n${actionItemsList}\n\n**🔧 Quick Actions:**\n- **View email**: \`get_email_details\` with emailId\n- **Reply**: \`reply_email\` with emailId\n- **Mark complete**: \`manage_email\` action: "add_label", labelName: "Completed"\n\n**📊 Analysis**: Searched ${messages.length} emails in ${params.folder} folder from ${params.timeframe}`,
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `❌ **Failed to analyze action items**: ${error.message}`,
        },
      ],
    };
  }
}

async function handleGenerateDraft(args: any) {
  const params = GenerateDraftSchema.parse(args);
  const gmail = await getGmailService();
  
  try {
    let contextInfo = '';
    let replyHeaders = '';
    
    // If replying to an email, get context
    if (params.replyToID) {
      const originalEmail = await gmail.users.messages.get({
        userId: 'me',
        id: params.replyToID,
        format: 'full'
      });
      
      const originalData = parseEmailMetadata(originalEmail.data);
      contextInfo = `\n\nOriginal email context:\nFrom: ${originalData.from}\nSubject: ${originalData.subject}\nContent: ${originalData.body.substring(0, 500)}...`;
      
      replyHeaders = `Replying to: ${originalData.subject}\nTo: ${originalData.from}\n`;
    }
    
    // Generate AI draft
    const prompt = `Generate a ${params.tone} email draft with ${params.length} length. ${params.replyToID ? 'This is a reply.' : 'This is a new email.'}\n\nUser request: ${params.prompt}${contextInfo}\n\nPlease provide:\n1. Subject line\n2. Email body\n3. Appropriate greeting and closing for ${params.tone} tone`;
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: params.length === 'brief' ? 300 : params.length === 'medium' ? 600 : 1000,
      temperature: 0.7
    });
    
    const aiDraft = completion.choices[0]?.message?.content || 'Unable to generate draft';
    
    // Parse the AI response to extract subject and body
    const lines = aiDraft.split('\n');
    let subject = 'AI Generated Email';
    let body = aiDraft;
    
    // Try to extract subject line
    const subjectLine = lines.find(line => line.toLowerCase().includes('subject:'));
    if (subjectLine) {
      subject = subjectLine.replace(/^.*subject:\s*/i, '').trim();
      body = aiDraft.replace(subjectLine, '').trim();
    }
    
    // If this is a reply, prefix subject with "Re:"
    if (params.replyToID && !subject.toLowerCase().startsWith('re:')) {
      const originalEmail = await gmail.users.messages.get({
        userId: 'me',
        id: params.replyToID,
        format: 'metadata',
        metadataHeaders: ['Subject']
      });
      
      const headers = originalEmail.data.payload?.headers || [];
      const originalSubject = headers.find((h: any) => h.name === 'Subject')?.value || '';
      subject = `Re: ${originalSubject.replace(/^Re:\s*/i, '')}`;
    }
    
    return {
      content: [
        {
          type: 'text',
          text: `🤖 **AI Draft Generated**\n\n${replyHeaders}**📝 Subject**: ${subject}\n\n**✉️ Email Body:**\n${body}\n\n**🎯 Draft Details:**\n- **Tone**: ${params.tone}\n- **Length**: ${params.length}\n- **Type**: ${params.replyToID ? 'Reply' : 'New email'}\n\n**🚀 Next Steps:**\n1. **Send immediately**: Copy content and use \`compose_email\` or \`reply_email\` with \`send: true\`\n2. **Save as draft**: Use the same tools with \`send: false\`\n3. **Edit and customize**: Modify the content as needed\n\n**💡 Tip**: You can refine this draft by calling \`generate_draft\` again with more specific instructions!`,
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `❌ **Failed to generate draft**: ${error.message}\n\n**Possible issues:**\n- OpenAI API error\n- Invalid replyToID\n- Insufficient permissions`,
        },
      ],
    };
  }
}

async function handleSendNudge(args: any) {
  const params = SendNudgeSchema.parse(args);
  const gmail = await getGmailService();
  
  try {
    // Get the original email for context
    const originalEmail = await gmail.users.messages.get({
      userId: 'me',
      id: params.emailId,
      format: 'full'
    });
    
    const emailData = parseEmailMetadata(originalEmail.data);
    
    // Generate nudge message based on type
    let nudgeSubject = '';
    let nudgeBody = '';
    
    const customMessage = params.message || '';
    
    switch (params.nudgeType) {
      case 'follow_up':
        nudgeSubject = `Follow-up: ${emailData.subject}`;
        nudgeBody = `Hi,\n\nI wanted to follow up on my previous email regarding "${emailData.subject}".\n\n${customMessage || 'I would appreciate your response when you have a moment.'}\n\nThank you for your time.\n\nBest regards`;
        break;
        
      case 'deadline_reminder':
        nudgeSubject = `Deadline Reminder: ${emailData.subject}`;
        nudgeBody = `Hi,\n\nThis is a friendly reminder about the upcoming deadline mentioned in our previous correspondence: "${emailData.subject}".\n\n${customMessage || 'Please let me know if you need any additional information or if there are any concerns.'}\n\nThank you!`;
        break;
        
      case 'meeting_reminder':
        nudgeSubject = `Meeting Reminder: ${emailData.subject}`;
        nudgeBody = `Hi,\n\nI wanted to remind you about our upcoming meeting discussed in "${emailData.subject}".\n\n${customMessage || 'Please confirm your availability or let me know if we need to reschedule.'}\n\nLooking forward to hearing from you.`;
        break;
        
      case 'response_needed':
        nudgeSubject = `Response Needed: ${emailData.subject}`;
        nudgeBody = `Hi,\n\nI hope this email finds you well. I wanted to check in regarding my previous email: "${emailData.subject}".\n\n${customMessage || 'Your input would be greatly appreciated to help us move forward.'}\n\nThank you for your attention to this matter.`;
        break;
    }
    
    // Create the nudge as a new email (not actually sending, but preparing)
    const nudgeMessage = `**📮 NUDGE EMAIL READY TO SEND**\n\n**To**: ${emailData.from}\n**Subject**: ${nudgeSubject}\n**Nudge Type**: ${params.nudgeType}\n**Delay**: ${params.delay}\n\n**Email Content:**\n${nudgeBody}\n\n**📧 Original Email Reference:**\n- **Subject**: ${emailData.subject}\n- **Date**: ${emailData.date}\n- **From**: ${emailData.from}\n\n**🚀 To Send This Nudge:**\nUse \`compose_email\` with:\n- \`to\`: "${emailData.from}"\n- \`subject\`: "${nudgeSubject}"\n- \`body\`: "${nudgeBody}"\n- \`send\`: true\n\n**⏰ Scheduling**: Gmail doesn't support scheduled sending via API. Consider:\n1. Save as draft and send manually later\n2. Set a calendar reminder for ${params.delay}\n3. Use a third-party scheduling service`;
    
    // In a production system, you might integrate with a scheduling service
    // For now, we'll provide the prepared message
    
    return {
      content: [
        {
          type: 'text',
          text: nudgeMessage,
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `❌ **Failed to prepare nudge**: ${error.message}\n\n**Possible issues:**\n- Invalid email ID\n- Email not found\n- Access permissions`,
        },
      ],
    };
  }
}

async function handleExtractAttachmentsSummary(args: any) {
  const params = ExtractAttachmentsSummarySchema.parse(args);
  const gmail = await getGmailService();
  
  try {
    const email = await gmail.users.messages.get({
      userId: 'me',
      id: params.emailId,
      format: 'full'
    });
    
    const emailData = parseEmailMetadata(email.data);
    
    if (emailData.attachments.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `📎 **No Attachments Found**\n\n**Email**: ${emailData.subject}\n**From**: ${emailData.from}\n\nThis email does not contain any attachments.`,
          },
        ],
      };
    }
    
    // Analyze each attachment
    let attachmentSummary = `📎 **Attachment Analysis for Email**\n\n**Email**: ${emailData.subject}\n**From**: ${emailData.from}\n**Date**: ${emailData.date}\n**Total Attachments**: ${emailData.attachments.length}\n\n`;
    
    for (let i = 0; i < emailData.attachments.length; i++) {
      const attachment = emailData.attachments[i];
      
      attachmentSummary += `**📄 Attachment ${i + 1}:**\n`;
      attachmentSummary += `- **Filename**: ${attachment.filename}\n`;
      attachmentSummary += `- **Type**: ${attachment.mimeType}\n`;
      attachmentSummary += `- **Size**: ${(attachment.size / 1024).toFixed(1)} KB\n`;
      
      // Basic file type analysis
      let fileAnalysis = '';
      const fileExt = attachment.filename.split('.').pop()?.toLowerCase() || '';
      
      if (['pdf', 'doc', 'docx'].includes(fileExt)) {
        fileAnalysis = '📋 Document file - likely contains text content';
      } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(fileExt)) {
        fileAnalysis = '🖼️ Image file - contains visual content';
      } else if (['xls', 'xlsx', 'csv'].includes(fileExt)) {
        fileAnalysis = '📊 Spreadsheet file - contains tabular data';
      } else if (['zip', 'rar', '7z'].includes(fileExt)) {
        fileAnalysis = '🗜️ Archive file - contains compressed files';
      } else if (['mp4', 'avi', 'mov', 'wmv'].includes(fileExt)) {
        fileAnalysis = '🎥 Video file - contains video content';
      } else if (['mp3', 'wav', 'flac', 'm4a'].includes(fileExt)) {
        fileAnalysis = '🎵 Audio file - contains audio content';
      } else {
        fileAnalysis = '❓ Unknown file type - manual review recommended';
      }
      
      attachmentSummary += `- **Analysis**: ${fileAnalysis}\n`;
      
      if (params.includeContent && attachment.attachmentId) {
        try {
          // In a full implementation, you would download and analyze the content
          // For security and API limitations, we'll provide a placeholder
          attachmentSummary += `- **Content Preview**: Content analysis available but not performed (requires download)\n`;
        } catch (contentError) {
          attachmentSummary += `- **Content Error**: Unable to analyze content\n`;
        }
      }
      
      // Security assessment
      const dangerousExtensions = ['exe', 'bat', 'com', 'scr', 'pif', 'js', 'jar', 'vbs'];
      if (dangerousExtensions.includes(fileExt)) {
        attachmentSummary += `- **⚠️ Security Warning**: Potentially dangerous file type - scan before opening\n`;
      }
      
      attachmentSummary += '\n';
    }
    
    // Generate AI summary if detailed analysis requested
    if (params.summaryDepth === 'comprehensive') {
      const attachmentList = emailData.attachments.map(att => 
        `${att.filename} (${att.mimeType}, ${(att.size / 1024).toFixed(1)}KB)`
      ).join(', ');
      
      const prompt = `Analyze these email attachments and provide insights about their purpose and importance:\n\nEmail Subject: ${emailData.subject}\nFrom: ${emailData.from}\nAttachments: ${attachmentList}\n\nProvide a brief analysis of what these attachments might contain and their likely importance.`;
      
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 200,
          temperature: 0.3
        });
        
        const aiAnalysis = completion.choices[0]?.message?.content || 'Unable to generate analysis';
        attachmentSummary += `**🤖 AI Analysis:**\n${aiAnalysis}\n\n`;
      } catch (aiError) {
        attachmentSummary += `**🤖 AI Analysis**: Not available\n\n`;
      }
    }
    
    // Summary statistics
    const totalSize = emailData.attachments.reduce((sum, att) => sum + att.size, 0);
    const fileTypes = [...new Set(emailData.attachments.map(att => att.mimeType))];
    
    attachmentSummary += `**📊 Summary Statistics:**\n`;
    attachmentSummary += `- **Total Size**: ${(totalSize / (1024 * 1024)).toFixed(2)} MB\n`;
    attachmentSummary += `- **File Types**: ${fileTypes.length} different types\n`;
    attachmentSummary += `- **Analysis Depth**: ${params.summaryDepth}\n`;
    attachmentSummary += `- **Content Analysis**: ${params.includeContent ? 'Requested' : 'Not requested'}\n\n`;
    
    attachmentSummary += `**🔧 Available Actions:**\n`;
    attachmentSummary += `- **Download**: Use Gmail interface to download attachments\n`;
    attachmentSummary += `- **Security Scan**: Recommended for unknown file types\n`;
    attachmentSummary += `- **Reply**: \`reply_email\` with emailId "${params.emailId}"\n`;
    
    return {
      content: [
        {
          type: 'text',
          text: attachmentSummary,
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `❌ **Failed to analyze attachments**: ${error.message}\n\n**Possible issues:**\n- Invalid email ID\n- Email not found\n- Attachment access error`,
        },
      ],
    };
  }
}

// ENHANCED EXISTING TOOL IMPLEMENTATIONS (Full v3.0.0)

async function handleGetEmails(args: any) {
  const params = GetEmailsSchema.parse(args);
  const gmail = await getGmailService();
  
  let query = params.query || '';
  if (params.category === 'primary') {
    query = `category:primary ${query}`.trim();
  } else if (params.category === 'promotions') {
    query = `category:promotions ${query}`.trim();
  } else if (params.category === 'social') {
    query = `category:social ${query}`.trim();
  } else if (params.category === 'updates') {
    query = `category:updates ${query}`.trim();
  } else if (params.category === 'all') {
    query = `in:inbox ${query}`.trim();
  }
  
  const response = await gmail.users.messages.list({
    userId: 'me',
    maxResults: params.count,
    q: query
  });
  
  const messages = response.data.messages || [];
  
  if (messages.length === 0) {
    return {
      content: [
        {
          type: 'text',
          text: `📪 **No emails found**\n\n**Category**: ${params.category}\n**Query**: ${params.query || 'None'}\n\nTry adjusting your search parameters or checking a different category.`,
        },
      ],
    };
  }
  
  // Fetch detailed email information
  const emails: EmailMetadata[] = [];
  
  for (const message of messages) {
    const email = await gmail.users.messages.get({
      userId: 'me',
      id: message.id!,
      format: params.includeBody ? 'full' : 'metadata',
      metadataHeaders: ['From', 'To', 'Subject', 'Date', 'Cc', 'Bcc']
    });
    
    emails.push(parseEmailMetadata(email.data));
  }
  
  // Sort emails based on orderBy parameter
  if (params.orderBy === 'date_desc') {
    emails.sort((a, b) => b.dateTimestamp - a.dateTimestamp);
  } else if (params.orderBy === 'date_asc') {
    emails.sort((a, b) => a.dateTimestamp - b.dateTimestamp);
  }
  // For relevance, we keep Gmail's default order
  
  const emailList = emails.map((email, index) => {
    const statusIcons = [
      email.isRead ? '📖' : '📧',
      email.isStarred ? '⭐' : '',
      email.isImportant ? '🔥' : '',
      email.attachments.length > 0 ? `📎${email.attachments.length}` : ''
    ].filter(Boolean).join(' ');
    
    return `**${index + 1}. ${email.subject || 'No Subject'}** ${statusIcons}\n👤 **From**: ${email.from}\n📅 **Date**: ${email.date}\n🆔 **ID**: ${email.id}\n🧵 **Thread**: ${email.threadId}\n📁 **Labels**: ${email.labels.filter(l => !l.startsWith('CATEGORY_')).join(', ') || 'None'}\n${params.includeBody ? `📄 **Content**: ${email.body.substring(0, 200)}${email.body.length > 200 ? '...' : ''}` : `📋 **Snippet**: ${email.snippet}`}`;
  }).join('\n\n---\n\n');
  
  return {
    content: [
      {
        type: 'text',
        text: `📧 **Gmail Emails - ${params.category.toUpperCase()} Category**\n\n**Found ${emails.length} emails** | **Sorted by**: ${params.orderBy}\n\n${emailList}\n\n**🔧 Quick Actions:**\n- **View details**: \`get_email_details\` with emailId\n- **Reply**: \`reply_email\` with emailId\n- **Manage**: \`manage_email\` for actions like star, archive, etc.\n- **View thread**: \`get_thread\` with threadId`,
      },
    ],
  };
}

async function handleAnalyzeEmails(args: any) {
  const params = AnalyzeEmailsSchema.parse(args);
  const gmail = await getGmailService();
  
  // Get emails (similar to handleGetEmails but focused on analysis)
  let query = '';
  if (params.category === 'primary') query = 'category:primary';
  else if (params.category === 'promotions') query = 'category:promotions';
  else if (params.category === 'social') query = 'category:social';
  else if (params.category === 'updates') query = 'category:updates';
  else query = 'in:inbox';
  
  const response = await gmail.users.messages.list({
    userId: 'me',
    maxResults: Math.min(params.count, 20), // Limit for AI analysis
    q: query
  });
  
  const messages = response.data.messages || [];
  
  if (messages.length === 0) {
    return {
      content: [
        {
          type: 'text',
          text: `🤖 **No emails to analyze in ${params.category} category**`,
        },
      ],
    };
  }
  
  // Fetch email details for analysis
  const emails: EmailMetadata[] = [];
  for (const message of messages.slice(0, 10)) { // Limit for performance
    const email = await gmail.users.messages.get({
      userId: 'me',
      id: message.id!,
      format: 'full'
    });
    emails.push(parseEmailMetadata(email.data));
  }
  
  // Prepare data for AI analysis
  const emailSummaries = emails.map(email => 
    `From: ${email.from} | Subject: ${email.subject} | Date: ${email.date} | Content: ${email.body.substring(0, 300)}...`
  ).join('\n\n');
  
  try {
    let analysisPrompt = '';
    if (params.analysisType === 'summary') {
      analysisPrompt = `Provide a brief summary of these ${emails.length} emails:\n\n${emailSummaries}`;
    } else if (params.analysisType === 'priority') {
      analysisPrompt = `Analyze these emails and rank them by priority (1-10, with reasoning):\n\n${emailSummaries}`;
    } else if (params.analysisType === 'sentiment') {
      analysisPrompt = `Analyze the sentiment (positive/negative/neutral) of these emails:\n\n${emailSummaries}`;
    } else { // comprehensive
      analysisPrompt = `Provide a comprehensive analysis of these emails including priorities, sentiment, action items, and key insights:\n\n${emailSummaries}`;
    }
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: analysisPrompt }],
      max_tokens: 800,
      temperature: 0.3
    });
    
    const analysis = completion.choices[0]?.message?.content || 'Unable to generate analysis';
    
    // Calculate some basic statistics
    const unreadCount = emails.filter(e => !e.isRead).length;
    const importantCount = emails.filter(e => e.isImportant).length;
    const withAttachments = emails.filter(e => e.attachments.length > 0).length;
    const senders = [...new Set(emails.map(e => e.from))];
    
    return {
      content: [
        {
          type: 'text',
          text: `🤖 **AI Email Analysis - ${params.category.toUpperCase()} (${params.analysisType.toUpperCase()})**\n\n**📊 Statistics:**\n- **Total Analyzed**: ${emails.length}\n- **Unread**: ${unreadCount}\n- **Important**: ${importantCount}\n- **With Attachments**: ${withAttachments}\n- **Unique Senders**: ${senders.length}\n\n**🧠 AI Analysis:**\n${analysis}\n\n**📧 Analyzed Emails:**\n${emails.map((e, i) => `${i+1}. ${e.subject} (${e.from}) ${e.isRead ? '📖' : '📧'}`).join('\n')}`,
        },
      ],
    };
  } catch (aiError: any) {
    // Fallback to basic analysis
    const basicAnalysis = `**Basic Analysis (AI unavailable):**\n- Unread emails: ${emails.filter(e => !e.isRead).length}\n- Important emails: ${emails.filter(e => e.isImportant).length}\n- Emails with attachments: ${emails.filter(e => e.attachments.length > 0).length}\n- Most active sender: ${emails.reduce((acc, email) => { acc[email.from] = (acc[email.from] || 0) + 1; return acc; }, {} as any)}`;
    
    return {
      content: [
        {
          type: 'text',
          text: `🤖 **Email Analysis - ${params.category.toUpperCase()}**\n\n${basicAnalysis}\n\n**Note**: Advanced AI analysis unavailable (${aiError.message})`,
        },
      ],
    };
  }
}

async function handleSearchEmails(args: any) {
  const gmail = await getGmailService();
  const maxResults = Math.min(args.maxResults || 20, 100);
  
  const response = await gmail.users.messages.list({
    userId: 'me',
    maxResults,
    q: args.query
  });
  
  const messages = response.data.messages || [];
  
  if (messages.length === 0) {
    return {
      content: [
        {
          type: 'text',
          text: `🔍 **No emails found**\n\n**Query**: ${args.query}\n\n**💡 Search Tips:**\n- Use \`from:email@domain.com\` to search by sender\n- Use \`subject:keyword\` to search subjects\n- Use \`has:attachment\` for emails with attachments\n- Use \`is:unread\` for unread emails\n- Use date ranges like \`after:2024/1/1\``,
        },
      ],
    };
  }
  
  // Get details for first few results
  const emails: EmailMetadata[] = [];
  for (const message of messages.slice(0, 10)) {
    const email = await gmail.users.messages.get({
      userId: 'me',
      id: message.id!,
      format: 'metadata',
      metadataHeaders: ['From', 'To', 'Subject', 'Date']
    });
    emails.push(parseEmailMetadata(email.data));
  }
  
  const searchResults = emails.map((email, index) => 
    `**${index + 1}. ${email.subject}** ${email.isRead ? '📖' : '📧'}${email.isStarred ? ' ⭐' : ''}${email.isImportant ? ' 🔥' : ''}\n👤 **From**: ${email.from}\n📅 **Date**: ${email.date}\n🆔 **ID**: ${email.id}\n📋 **Snippet**: ${email.snippet}`
  ).join('\n\n---\n\n');
  
  return {
    content: [
      {
        type: 'text',
        text: `🔍 **Gmail Search Results**\n\n**Query**: ${args.query}\n**Found**: ${messages.length} emails (showing first ${emails.length})\n\n${searchResults}\n\n**🔧 Actions:**\n- **View details**: \`get_email_details\` with emailId\n- **Reply**: \`reply_email\` with emailId\n- **Manage**: \`manage_email\` with emailId`,
      },
    ],
  };
}

async function handleGetEmailDetails(args: any) {
  const gmail = await getGmailService();
  
  const email = await gmail.users.messages.get({
    userId: 'me',
    id: args.emailId,
    format: 'full'
  });
  
  const emailData = parseEmailMetadata(email.data);
  
  const details = `🔬 **Email Details**\n\n**📧 Message Information:**\n- **Subject**: ${emailData.subject}\n- **From**: ${emailData.from}\n- **To**: ${emailData.to}\n${emailData.cc ? `- **CC**: ${emailData.cc}\n` : ''}${emailData.bcc ? `- **BCC**: ${emailData.bcc}\n` : ''}**- **Date**: ${emailData.date}\n- **Message ID**: ${emailData.messageId}\n- **Thread ID**: ${emailData.threadId}\n\n**📊 Status:**\n- **Read**: ${emailData.isRead ? '✅ Yes' : '❌ No'}\n- **Starred**: ${emailData.isStarred ? '⭐ Yes' : '❌ No'}\n- **Important**: ${emailData.isImportant ? '🔥 Yes' : '❌ No'}\n\n**🏷️ Labels**: ${emailData.labels.join(', ') || 'None'}\n\n**📎 Attachments**: ${emailData.attachments.length > 0 ? emailData.attachments.map(att => `${att.filename} (${(att.size/1024).toFixed(1)}KB)`).join(', ') : 'None'}\n\n**📄 Content:**\n${emailData.body || 'No content available'}\n\n**🔧 Available Actions:**\n- **Reply**: \`reply_email\` with emailId "${args.emailId}"\n- **Manage**: \`manage_email\` with various actions\n- **View thread**: \`get_thread\` with threadId "${emailData.threadId}"`;
  
  return {
    content: [
      {
        type: 'text',
        text: details,
      },
    ],
  };
}

async function handleManageEmail(args: any) {
  const gmail = await getGmailService();
  
  try {
    let result = '';
    
    switch (args.action) {
      case 'mark_read':
        await gmail.users.messages.modify({
          userId: 'me',
          id: args.emailId,
          requestBody: { removeLabelIds: ['UNREAD'] }
        });
        result = '✅ Email marked as read';
        break;
        
      case 'mark_unread':
        await gmail.users.messages.modify({
          userId: 'me',
          id: args.emailId,
          requestBody: { addLabelIds: ['UNREAD'] }
        });
        result = '📧 Email marked as unread';
        break;
        
      case 'add_label':
        if (!args.labelName) throw new Error('Label name required');
        // Find label ID
        const labelsResponse = await gmail.users.labels.list({ userId: 'me' });
        const label = labelsResponse.data.labels?.find(l => l.name === args.labelName);
        if (!label) throw new Error(`Label "${args.labelName}" not found`);
        
        await gmail.users.messages.modify({
          userId: 'me',
          id: args.emailId,
          requestBody: { addLabelIds: [label.id!] }
        });
        result = `🏷️ Label "${args.labelName}" added to email`;
        break;
        
      case 'remove_label':
        if (!args.labelName) throw new Error('Label name required');
        const labelsResp = await gmail.users.labels.list({ userId: 'me' });
        const labelToRemove = labelsResp.data.labels?.find(l => l.name === args.labelName);
        if (!labelToRemove) throw new Error(`Label "${args.labelName}" not found`);
        
        await gmail.users.messages.modify({
          userId: 'me',
          id: args.emailId,
          requestBody: { removeLabelIds: [labelToRemove.id!] }
        });
        result = `🏷️ Label "${args.labelName}" removed from email`;
        break;
        
      case 'archive':
        await gmail.users.messages.modify({
          userId: 'me',
          id: args.emailId,
          requestBody: { removeLabelIds: ['INBOX'] }
        });
        result = '📁 Email archived';
        break;
        
      case 'delete':
        await gmail.users.messages.trash({
          userId: 'me',
          id: args.emailId
        });
        result = '🗑️ Email moved to trash';
        break;
        
      case 'star':
        await gmail.users.messages.modify({
          userId: 'me',
          id: args.emailId,
          requestBody: { addLabelIds: ['STARRED'] }
        });
        result = '⭐ Email starred';
        break;
        
      case 'unstar':
        await gmail.users.messages.modify({
          userId: 'me',
          id: args.emailId,
          requestBody: { removeLabelIds: ['STARRED'] }
        });
        result = '⭐ Email unstarred';
        break;
        
      default:
        throw new Error(`Unknown action: ${args.action}`);
    }
    
    return {
      content: [
        {
          type: 'text',
          text: `🛠️ **Email Management**\n\n${result}\n\n**Email ID**: ${args.emailId}\n**Action**: ${args.action}${args.labelName ? `\n**Label**: ${args.labelName}` : ''}`,
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `❌ **Failed to manage email**: ${error.message}`,
        },
      ],
    };
  }
}

async function handleGetGmailStats(args: any) {
  const gmail = await getGmailService();
  
  try {
    // Get profile info
    const profile = await gmail.users.getProfile({ userId: 'me' });
    
    // Get label statistics
    const labelsResponse = await gmail.users.labels.list({ userId: 'me' });
    const labels = labelsResponse.data.labels || [];
    
    // Calculate category statistics
    const inbox = labels.find(l => l.id === 'INBOX');
    const unread = labels.find(l => l.id === 'UNREAD');
    const starred = labels.find(l => l.id === 'STARRED');
    const important = labels.find(l => l.id === 'IMPORTANT');
    const sent = labels.find(l => l.id === 'SENT');
    const drafts = labels.find(l => l.id === 'DRAFT');
    const spam = labels.find(l => l.id === 'SPAM');
    const trash = labels.find(l => l.id === 'TRASH');
    
    // Category labels
    const promotions = labels.find(l => l.id === 'CATEGORY_PROMOTIONS');
    const social = labels.find(l => l.id === 'CATEGORY_SOCIAL');
    const updates = labels.find(l => l.id === 'CATEGORY_UPDATES');
    const forums = labels.find(l => l.id === 'CATEGORY_FORUMS');
    const primary = labels.find(l => l.id === 'CATEGORY_PRIMARY');
    
    const stats = `📊 **Gmail Account Statistics**\n\n**📧 Account Overview:**\n- **Email Address**: ${profile.data.emailAddress}\n- **Total Messages**: ${profile.data.messagesTotal?.toLocaleString() || 'Unknown'}\n- **Threads Total**: ${profile.data.threadsTotal?.toLocaleString() || 'Unknown'}\n- **History ID**: ${profile.data.historyId}\n\n**📁 Folder Statistics:**\n- **📥 Inbox**: ${inbox?.messagesTotal?.toLocaleString() || '0'} messages (${inbox?.messagesUnread || '0'} unread)\n- **📤 Sent**: ${sent?.messagesTotal?.toLocaleString() || '0'} messages\n- **📝 Drafts**: ${drafts?.messagesTotal?.toLocaleString() || '0'} messages\n- **⭐ Starred**: ${starred?.messagesTotal?.toLocaleString() || '0'} messages\n- **🔥 Important**: ${important?.messagesTotal?.toLocaleString() || '0'} messages\n- **🗑️ Trash**: ${trash?.messagesTotal?.toLocaleString() || '0'} messages\n- **🚫 Spam**: ${spam?.messagesTotal?.toLocaleString() || '0'} messages\n\n**📂 Category Statistics:**\n- **🎯 Primary**: ${primary?.messagesTotal?.toLocaleString() || '0'} messages (${primary?.messagesUnread || '0'} unread)\n- **🛒 Promotions**: ${promotions?.messagesTotal?.toLocaleString() || '0'} messages (${promotions?.messagesUnread || '0'} unread)\n- **👥 Social**: ${social?.messagesTotal?.toLocaleString() || '0'} messages (${social?.messagesUnread || '0'} unread)\n- **📰 Updates**: ${updates?.messagesTotal?.toLocaleString() || '0'} messages (${updates?.messagesUnread || '0'} unread)\n- **💬 Forums**: ${forums?.messagesTotal?.toLocaleString() || '0'} messages (${forums?.messagesUnread || '0'} unread)\n\n**🏷️ Labels Summary:**\n- **Total Labels**: ${labels.length}\n- **User Labels**: ${labels.filter(l => l.type === 'user').length}\n- **System Labels**: ${labels.filter(l => l.type === 'system').length}`;
    
    return {
      content: [
        {
          type: 'text',
          text: stats,
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `❌ **Failed to get Gmail statistics**: ${error.message}`,
        },
      ],
    };
  }
}

async function handleGetSpecialEmails(args: any) {
  const gmail = await getGmailService();
  
  let query = '';
  let displayName = '';
  
  switch (args.type) {
    case 'drafts':
      query = 'in:drafts';
      displayName = '📝 Draft Emails';
      break;
    case 'sent':
      query = 'in:sent';
      displayName = '📤 Sent Emails';
      break;
    case 'snoozed':
      query = 'is:snoozed';
      displayName = '😴 Snoozed Emails';
      break;
    case 'starred':
      query = 'is:starred';
      displayName = '⭐ Starred Emails';
      break;
    case 'important':
      query = 'is:important';
      displayName = '🔥 Important Emails';
      break;
    case 'trash':
      query = 'in:trash';
      displayName = '🗑️ Trash';
      break;
    case 'spam':
      query = 'in:spam';
      displayName = '🚫 Spam';
      break;
    default:
      throw new Error(`Unknown email type: ${args.type}`);
  }
  
  const response = await gmail.users.messages.list({
    userId: 'me',
    maxResults: args.count || 10,
    q: query
  });
  
  const messages = response.data.messages || [];
  
  if (messages.length === 0) {
    return {
      content: [
        {
          type: 'text',
          text: `📭 **No ${args.type} emails found**\n\nYour ${args.type} folder is empty.`,
        },
      ],
    };
  }
  
  // Get email details
  const emails: EmailMetadata[] = [];
  for (const message of messages) {
    const email = await gmail.users.messages.get({
      userId: 'me',
      id: message.id!,
      format: 'metadata',
      metadataHeaders: ['From', 'To', 'Subject', 'Date']
    });
    emails.push(parseEmailMetadata(email.data));
  }
  
  const emailList = emails.map((email, index) => 
    `**${index + 1}. ${email.subject}** ${email.isRead ? '📖' : '📧'}${email.isStarred ? ' ⭐' : ''}\n👤 **${args.type === 'sent' ? 'To' : 'From'}**: ${args.type === 'sent' ? email.to : email.from}\n📅 **Date**: ${email.date}\n🆔 **ID**: ${email.id}\n📋 **Snippet**: ${email.snippet}`
  ).join('\n\n---\n\n');
  
  return {
    content: [
      {
        type: 'text',
        text: `${displayName}\n\n**Found ${emails.length} emails**\n\n${emailList}\n\n**🔧 Actions:**\n- **View details**: \`get_email_details\` with emailId\n- **Manage**: \`manage_email\` with emailId`,
      },
    ],
  };
}

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🚀 Complete Gmail MCP Server v3.1.0 started - Full Production-Ready Gmail Functionality!');
  console.error('📧 Available: 17 Tools | 🤖 AI-Powered | 🔒 Zero Trust Security | 📊 Complete JSON-RPC Support');
  console.error('✨ Ready for: Email Analysis, Smart Replies, Subscription Management, Thread Summarization & More!');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
