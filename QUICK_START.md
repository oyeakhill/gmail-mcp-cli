# 🚀 Gmail MCP Server - Quick Start (5 Minutes)

## What You'll Get
Access your Gmail directly in Claude Desktop with 17 powerful tools:
- 📧 Read, search, and analyze emails
- ✍️ Compose and reply to emails  
- 🔔 Manage subscriptions (unsubscribe with one command!)
- 🏷️ Organize with labels
- 🤖 AI-powered email insights

## Setup Steps

### 1️⃣ **Run Setup Command** (30 seconds)
```bash
npx gmail-mcp-cli@latest init
# Choose "Local Development (Claude Desktop)"
```

### 2️⃣ **Get Gmail API Access** (3 minutes)
1. Go to: https://console.cloud.google.com/
2. Create new project → Enable Gmail API
3. Create credentials → OAuth 2.0 → Desktop app
4. Download → Save as `server/credentials.json`

### 3️⃣ **Authorize & Build** (1 minute)
```bash
cd server
npm run setup      # Opens browser - authorize Gmail
npm run build      # Builds the server
```

### 4️⃣ **Restart Claude Desktop** (30 seconds)
- Quit Claude Desktop completely
- Start it again
- Look for the 🔨 tools icon

### ✅ **Test It!**
Ask Claude:
- "Show me my recent emails"
- "What emails need replies?"
- "Unsubscribe me from newsletters"

## 🆘 Need Help?
- Full guide: [USER_SETUP_GUIDE.md](./USER_SETUP_GUIDE.md)
- Issues: https://github.com/akhilpal0/gmail-mcp-cli/issues
- Video tutorial: [Coming soon]

---
**Built with ❤️ for the Claude community**
