# 🔐 Gmail API Setup Guide for New Users

## Prerequisites
- Gmail account
- Claude Desktop installed
- Node.js 18+ installed

## Step-by-Step Gmail API Setup

### 1️⃣ **Create Google Cloud Project**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "NEW PROJECT"
3. Name: `gmail-mcp-server`
4. Click "CREATE"

### 2️⃣ **Enable Gmail API**
1. In your project, go to "APIs & Services" → "Library"
2. Search for "Gmail API"
3. Click on it and press "ENABLE"

### 3️⃣ **Create OAuth Credentials**
1. Go to "APIs & Services" → "Credentials"
2. Click "CREATE CREDENTIALS" → "OAuth client ID"
3. If prompted, configure consent screen first:
   - User Type: "External"
   - App name: "Gmail MCP Server"
   - User support email: Your email
   - Developer contact: Your email

### 4️⃣ **Configure OAuth Client**
1. Application type: "Desktop app"
2. Name: "Gmail MCP Desktop"
3. Click "CREATE"
4. Click "DOWNLOAD JSON"
5. Save as `credentials.json`

### 5️⃣ **Place Credentials File**
```bash
# After running npx gmail-mcp-cli init, you'll have a 'server' folder
# Copy credentials.json to:
server/credentials.json
```

### 6️⃣ **Authorize Gmail Access**
```bash
cd server
npm run setup

# This will:
# 1. Open browser for Gmail authorization
# 2. Select your Gmail account
# 3. Allow all requested permissions
# 4. Create token.json automatically
```

### 7️⃣ **Build the Server**
```bash
npm run build
```

### 8️⃣ **Configure Claude Desktop**
The CLI already did this, but verify in:
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Mac: `~/Library/Application Support/Claude/claude_desktop_config.json`

Should contain:
```json
{
  "mcpServers": {
    "gmail-mcp-server": {
      "command": "node",
      "args": ["C:\\path\\to\\your\\server\\dist\\index.js"]
    }
  }
}
```

### 9️⃣ **Restart Claude Desktop**
- Fully quit Claude Desktop
- Start it again

### 🎉 **You're Done! Test It:**
In Claude Desktop, try:
- "Show me my recent emails"
- "List my email subscriptions"
- "Search for unread emails"
- "What emails need my attention?"

## 🔧 Troubleshooting

### "Server not found" in Claude
- Check claude_desktop_config.json path
- Ensure server/dist/index.js exists
- Restart Claude Desktop

### "Authentication failed"
- Delete token.json and run `npm run setup` again
- Check credentials.json is valid
- Ensure Gmail API is enabled

### "No MCP tools showing"
- Look for hammer icon in Claude Desktop
- Check logs: `~/Library/Logs/Claude/mcp*.log`
- Rebuild server: `npm run build`
