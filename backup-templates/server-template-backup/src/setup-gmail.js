import { authenticate } from '@google-cloud/local-auth';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

export async function authorizeGmail() {
  console.log('Starting Gmail authorization...');
  
  try {
    await fs.access(CREDENTIALS_PATH);
  } catch {
    console.error('ERROR: credentials.json not found!');
    console.error('Please download OAuth2 credentials from Google Cloud Console');
    process.exit(1);
  }

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
    
    console.log('✅ Gmail authorization successful!');
    console.log('📁 Token saved to token.json');
    return true;
  }
  return false;
}

// Default export for CLI usage
export default authorizeGmail;

// Direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  authorizeGmail().catch((error) => {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Setup failed:', errorMessage);
    process.exit(1);
  });
}
