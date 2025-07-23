# Gmail MCP CLI 📧

A powerful command-line tool that deploys a Gmail MCP (Model Context Protocol) Server with 17 AI-powered Gmail tools for Claude Desktop. One-command setup with automatic OAuth authentication!

<p align="center">
  <img src="https://img.shields.io/npm/v/gmail-mcp-cli.svg" alt="npm version">
  <img src="https://img.shields.io/badge/Gmail%20Tools-17-blue.svg" alt="Gmail Tools">
  <img src="https://img.shields.io/badge/AI%20Powered-OpenAI-green.svg" alt="AI Powered">
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License">
</p>

## 🚀 What is Gmail MCP CLI?

Gmail MCP CLI is a tool that sets up a Gmail server for Claude Desktop using the Model Context Protocol (MCP). It provides Claude with the ability to:

- 📧 Read and search your Gmail emails
- ✍️ Compose, reply, and send emails
- 🏷️ Manage labels and organize emails
- 🚫 Manage email subscriptions (unsubscribe with one command!)
- 🤖 AI-powered email analysis and insights
- 📊 Generate email statistics and reports
- And much more with 17 total Gmail tools!

## 📋 Prerequisites

### 1. Install Node.js (Required)

You must have Node.js installed on your computer to run this tool.

- **Check if installed**: Open terminal/command prompt and run:
  ```bash
  node --version
  npm --version
  ```
- **Minimum required**: Node.js v18.0.0 or higher, npm v9.0.0 or higher
- **Download**: If not installed, download from https://nodejs.org/
  - Choose the "LTS" version (recommended)
  - The installer will install both Node.js and npm

### 2. Install Claude Desktop (Required)

You must have Claude Desktop installed and properly configured:

1. **Download Claude Desktop**: https://claude.ai/download
2. **Install and sign in** to your Claude account
3. **Enable Developer Mode** (IMPORTANT!):
   - Open Claude Desktop
   - Go to **File → Settings** (Windows) or **Claude → Settings** (Mac)
   - Navigate to the **Developer** tab
   - Find **"Edit Config"** option
   - Click it once to create the configuration file
   - You can close the config file that opens

   ⚠️ **This step is crucial!** It creates the `claude_desktop_config.json` file in:
   - Windows: `%APPDATA%\Roaming\Claude\claude_desktop_config.json`
   - Mac: `~/Library/Application Support/Claude/claude_desktop_config.json`

### 3. Get an OpenAI API Key (Required for AI features)

The Gmail MCP Server uses OpenAI for AI-powered features:

1. Go to https://platform.openai.com/api-keys
2. Sign up or log in
3. Create a new API key
4. Copy the key (starts with `sk-`)
5. Keep it ready for the setup process

### 4. Gmail Account

- Any regular Gmail account works
- No special configuration needed
- The tool will guide you through authentication

## 🛠️ Installation & Setup

### Step 1: Open Terminal/Command Prompt

- **Windows**: Press `Win + R`, type `cmd`, press Enter
- **Mac**: Press `Cmd + Space`, type `terminal`, press Enter
- **Linux**: Press `Ctrl + Alt + T`

### Step 2: Navigate to Your Projects Directory

```bash
# Create a directory for the project (optional)
mkdir gmail-mcp-project
cd gmail-mcp-project
```

### Step 3: Initialize the Gmail MCP Server

Run this command in your terminal:

```bash
npx gmail-mcp-cli init
```

**What happens next:**
1. The tool will download automatically (first time only)
2. You'll see a welcome banner
3. Answer the prompts:
   - **Project name**: Press Enter to use default `gmail-mcp-server`
   - **Deployment target**: Select `🖥️ Claude Desktop (Recommended)`
   - **OpenAI API Key**: Paste your OpenAI API key (required!)

### Step 4: Gmail Authentication

After entering the details:

1. **Your browser will open automatically** with Google sign-in
2. **Select your Gmail account**
3. **Review permissions** - the tool needs these to work:
   - Read your emails
   - Compose and send emails
   - Manage labels
   - Modify email settings
4. **Click "Allow"**
5. **You'll see a success page** - close the browser tab
6. **Return to your terminal** - you should see "✅ Gmail MCP Server Ready!"

### Step 5: Deploy to Claude Desktop

Now deploy the server with:

```bash
npx gmail-mcp-cli deploy
```

This command:
- Builds the server
- Configures Claude Desktop automatically
- Shows a success message when complete

### Step 6: Restart Claude Desktop (IMPORTANT!)

You MUST restart Claude Desktop for the changes to take effect:

1. **Completely quit Claude Desktop**:
   - Windows: Right-click Claude in system tray → Quit
   - Mac: Claude → Quit Claude (or Cmd+Q)
2. **Wait 5 seconds**
3. **Start Claude Desktop again**

### Step 7: Verify It's Working

In Claude Desktop, try these test commands:
- "List my recent emails"
- "Show me my unread emails"
- "Search for emails from the last week"

If Claude responds with your email data, congratulations! 🎉

## 🎯 Available Gmail Tools

Your Claude Desktop now has access to 17 Gmail tools:

### 📧 Email Management
- `get_emails` - Get emails with filtering and sorting
- `search_emails` - Advanced email search
- `get_email_details` - View complete email details
- `manage_email` - Star, archive, mark as read/unread

### ✍️ Email Composition
- `compose_email` - Create new emails
- `reply_email` - Reply to emails
- `forward_email` - Forward emails

### 🏷️ Organization
- `manage_labels` - Create and manage Gmail labels
- `get_thread` - View email conversations
- `get_special_emails` - Find important/starred emails

### 🚫 Subscription Management
- `manage_subscriptions` - List and unsubscribe from mailing lists
- `get_gmail_stats` - Email statistics and insights

### 🤖 AI-Powered Analysis
- `analyze_emails` - AI-powered email analysis
- `summarize_thread` - Summarize email conversations
- And more!

## 💻 Usage Examples

### In Claude Desktop

Once set up, you can ask Claude things like:

```
"Show me emails from the last week"
"Search for emails with attachments"
"Help me unsubscribe from marketing emails"
"Compose a professional email to my boss about taking time off"
"Analyze my email patterns"
"Star all emails from important@company.com"
"What are my most recent unread emails?"
"Show me all emails with the label 'Important'"
```

### CLI Commands Reference

```bash
# Check installation status
npx gmail-mcp-cli status

# View server logs
npx gmail-mcp-cli logs

# Reinitialize (if something goes wrong)
npx gmail-mcp-cli init

# Deploy again (after changes)
npx gmail-mcp-cli deploy
```

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. "Command not found" or "npx not recognized"
- **Problem**: Node.js is not installed or not in PATH
- **Solution**: 
  - Install Node.js from https://nodejs.org/
  - Restart your terminal after installation
  - Verify with `node --version`

#### 2. "Claude Desktop config file not found"
- **Problem**: Developer mode not enabled in Claude
- **Solution**: 
  1. Open Claude Desktop
  2. Go to File → Settings → Developer
  3. Click "Edit Config" once
  4. Close the file that opens
  5. Try the deployment again

#### 3. "Claude Desktop not responding to Gmail commands"
- **Problem**: Claude not restarted after deployment
- **Solution**: 
  - Completely quit Claude Desktop (not just minimize)
  - Wait 5 seconds
  - Start Claude Desktop again
  - Try your Gmail commands

#### 4. "Authentication failed" during Gmail setup
- **Solution**: 
  - Clear browser cookies for accounts.google.com
  - Run `npx gmail-mcp-cli init` again
  - Use a different browser if issues persist
  - Make sure to allow ALL requested permissions

#### 5. "OpenAI API Key error"
- **Solution**: 
  - Verify your API key starts with `sk-`
  - Check OpenAI account for credits/billing
  - Generate a new key if needed
  - Ensure no extra spaces when pasting

#### 6. "Port 3000 already in use"
- **Solution**: 
  - Close any apps using port 3000 (dev servers, etc.)
  - Or wait 30 seconds and try again

### Manual Configuration Check

If automated setup fails, verify your configuration:

1. **Check Claude Desktop Config Location**:
   ```bash
   # Windows (in Command Prompt)
   type %APPDATA%\Claude\claude_desktop_config.json
   
   # Mac/Linux (in Terminal)
   cat ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

2. **Verify Server Installation**:
   ```bash
   npx gmail-mcp-cli status
   ```

3. **The config should contain**:
   ```json
   {
     "mcpServers": {
       "gmail-mcp-server": {
         "command": "node",
         "args": ["full/path/to/your/server/src/index.js"],
         "env": {
           "OPENAI_API_KEY": "your-openai-key",
           "NODE_ENV": "production"
         }
       }
     }
   }
   ```

## 🔒 Security & Privacy

- **OAuth Authentication**: Uses Google's official OAuth2 flow
- **Local Storage**: All credentials stored locally on your machine
- **No Data Collection**: The CLI doesn't collect or transmit your emails
- **Token Security**: Gmail tokens encrypted and stored in your project folder
- **Open Source**: Full source code available for security review

## 📁 Project Structure

After setup, your project directory will contain:
```
gmail-mcp-project/
├── server/                 # Gmail MCP Server files
│   ├── src/               
│   │   └── index.js       # Main server file
│   ├── token.json         # Gmail auth token (git-ignored)
│   ├── credentials.json   # OAuth credentials
│   └── package.json       
├── .env                   # Environment variables
└── .gmail-mcp.json       # CLI configuration
```

## 🌐 Alternative Deployment Options

### Deploy to Railway (for remote/cloud access)

```bash
npx gmail-mcp-cli init
# Choose "Railway" as deployment target
# Follow Railway-specific setup
npx gmail-mcp-cli deploy
```

### Deploy to Render

```bash
npx gmail-mcp-cli init
# Choose "Render" as deployment target
# Follow Render-specific setup
```

## 🤝 Contributing

Contributions are welcome! Please check out our [GitHub repository](https://github.com/oyeakhill/gmail-mcp-cli).

## 📝 License

MIT License - see LICENSE file for details

## 🆘 Getting Help

- **GitHub Issues**: [Report bugs or request features](https://github.com/oyeakhill/gmail-mcp-cli/issues)
- **Documentation**: [Full documentation](https://github.com/oyeakhill/gmail-mcp-cli/wiki)
- **Common Issues**: Check the Troubleshooting section above

## 🎉 Quick Start Summary

```bash
# 1. Ensure Node.js is installed
node --version

# 2. Ensure Claude Desktop is installed and Developer mode enabled
# (File → Settings → Developer → Edit Config)

# 3. Initialize Gmail MCP
npx gmail-mcp-cli init

# 4. Complete Gmail authentication in browser

# 5. Deploy to Claude
npx gmail-mcp-cli deploy

# 6. Restart Claude Desktop completely

# 7. Test with "Show me my recent emails"
```

---

Made with ❤️ by Akhil | [GitHub](https://github.com/oyeakhill/gmail-mcp-cli) | [npm](https://www.npmjs.com/package/gmail-mcp-cli)
