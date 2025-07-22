import { authenticate } from '@google-cloud/local-auth';
import * as fs from 'fs/promises';
import * as path from 'path';

// v3.0.0: Complete Gmail functionality including subscription management
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/gmail.settings.basic',
  'https://www.googleapis.com/auth/gmail.settings.sharing'
];

const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

async function authorizeGmail() {
  try {
    // Check if credentials.json exists
    await fs.access(CREDENTIALS_PATH);
  } catch {
    console.error('ERROR: credentials.json not found!');
    console.error('Please download your OAuth2 credentials from Google Cloud Console');
    console.error('and save them as credentials.json in the project root.');
    console.error('');
    console.error('Make sure to enable the Gmail API in your Google Cloud Console project.');
    process.exit(1);
  }

  console.log('Starting Gmail authorization for v3.0.0...');
  console.log('');
  console.log('📧 Requesting COMPLETE Gmail permissions for:');
  console.log('  ✓ Read Gmail emails');
  console.log('  ✓ Modify emails (mark read/unread, star, labels)');
  console.log('  ✓ Compose, reply, and send emails');
  console.log('  ✓ Manage subscriptions and unsubscribe');
  console.log('  ✓ Create and manage labels');
  console.log('  ✓ Email filters and settings');
  console.log('  ✓ Full Gmail client functionality');
  console.log('');

  const client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  
  if (client.credentials) {
    const content = await fs.readFile(CREDENTIALS_PATH, 'utf-8');
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
      type: 'authorized_user',
      client_id: key.client_id,
      client_secret: key.client_secret,
      refresh_token: client.credentials.refresh_token,
    }, null, 2);
    await fs.writeFile(TOKEN_PATH, payload);
    
    console.log('✅ Authorization successful for v3.0.0!');
    console.log('📁 Token saved to token.json');
    console.log('');
    console.log('🚀 Complete Gmail MCP Server v3.0.0 is ready!');
    console.log('');
    console.log('🎆 NEW v3.0.0 Features Available:');
    console.log('  • Subscription Management (unsubscribe, block senders)');
    console.log('  • Email Composition (compose, reply, forward)');
    console.log('  • Label Management (create, delete labels)');
    console.log('  • Thread Conversations');
    console.log('');
    console.log('Next steps:');
    console.log('1. Build: npm run build');
    console.log('2. Test: npm run start');
    console.log('3. Try: "List my email subscriptions"');
    console.log('4. Try: "Unsubscribe from [sender]"');
    console.log('5. Configure Claude Desktop');
  } else {
    console.error('❌ Authorization failed - no credentials received');
    process.exit(1);
  }
}

console.log('🚀 Complete Gmail MCP Server v3.0.0 - Setup');
console.log('=============================================');
console.log('This script authorizes FULL Gmail API access for complete functionality.');
console.log('A browser window will open for authentication.');
console.log('');
console.log('🎆 v3.0.0 NEW: Subscription Management + Email Composition');
console.log('   Now includes unsubscribe, compose emails, manage labels, and more!');
console.log('');
console.log('⚠️  Important: Expanded permissions needed for new features.');
console.log('');

authorizeGmail().catch((error) => {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
});
