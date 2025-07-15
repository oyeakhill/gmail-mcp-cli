# Gmail MCP Server v3.0.0

[![NPM Version](https://img.shields.io/npm/v/@akhilpal/gmail-mcp-server.svg)](https://www.npmjs.com/package/@akhilpal/gmail-mcp-server)
[![Downloads](https://img.shields.io/npm/dm/@akhilpal/gmail-mcp-server.svg)](https://www.npmjs.com/package/@akhilpal/gmail-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

🚀 **Complete Model Context Protocol server for Gmail with AI-powered email management, subscription control, and full Gmail functionality.**

## ✨ Features

- 📧 **Complete Gmail Management** - Read, send, organize, and manage emails
- 🚫 **Subscription Control** - Unsubscribe and block unwanted emails automatically
- 🤖 **AI-Powered Analysis** - Smart email insights with OpenAI integration
- 🏷️ **Label Management** - Create and organize Gmail labels
- 🧵 **Thread Support** - Full conversation context and management
- ⚡ **Real-time Integration** - Live Gmail API connection
- 🔒 **Secure OAuth** - Industry-standard Gmail authentication

## 🚀 Quick Start

### NPX (Recommended)
```bash
# Run directly with NPX - no installation needed
npx @akhilpal/gmail-mcp-server

# With specific configuration
npx @akhilpal/gmail-mcp-server --setup
```

### Global Installation
```bash
# Install globally
npm install -g @akhilpal/gmail-mcp-server

# Run the server
gmail-mcp-server

# Or use short alias
gmail-mcp
```

## 📋 Prerequisites

1. **Node.js 18+** - [Download here](https://nodejs.org/)
2. **Gmail API Credentials** - [Setup guide below](#gmail-api-setup)
3. **OpenAI API Key** - Optional, for AI features

## 🔧 Setup Instructions

### 1. Gmail API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Gmail API
4. Create credentials (OAuth 2.0 Client ID)
5. Download the credentials as `credentials.json`
6. Place `credentials.json` in your working directory

### 2. Environment Configuration

Create a `.env` file in your working directory:
```bash
# Required for AI features (optional)
OPENAI_API_KEY=your-openai-api-key-here

# Optional: Specific Gmail address
GMAIL_ADDRESS=your-email@gmail.com
```

### 3. Initial Authentication

```bash
# Run setup to authenticate with Gmail
npx @akhilpal/gmail-mcp-server --setup

# Or if installed globally
gmail-mcp-server --setup
```

## 🛠 MCP Client Configuration

### Claude Desktop
Add to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "gmail": {
      "command": "npx",
      "args": ["@akhilpal/gmail-mcp-server"]
    }
  }
}
```

### Cursor IDE
Add to your MCP configuration:
```json
{
  "mcpServers": {
    "gmail": {
      "command": "npx",
      "args": ["-y", "@akhilpal/gmail-mcp-server"]
    }
  }
}
```

### Windsurf
```json
{
  "mcpServers": {
    "gmail-server": {
      "command": "npx",
      "args": ["@akhilpal/gmail-mcp-server"]
    }
  }
}
```

## 📖 Available Tools

| Category | Tools | Description |
|----------|-------|-------------|
| **📧 Email Management** | `get_emails`, `search_emails`, `get_email_details` | Read and search emails |
| **✍️ Email Composition** | `compose_email`, `reply_email` | Write and send emails |
| **🚫 Subscription Control** | `manage_subscriptions` | Unsubscribe and block senders |
| **🏷️ Organization** | `manage_labels`, `get_thread` | Organize with labels and threads |
| **📊 Analytics** | `get_gmail_stats`, `analyze_emails` | Email insights and statistics |
| **🔧 Management** | `manage_email` | Star, archive, delete emails |

## 🤖 AI-Powered Features

When configured with OpenAI API key:
- **Smart Email Summaries** - AI-generated email summaries
- **Priority Detection** - Automatic email priority classification
- **Sentiment Analysis** - Understand email sentiment
- **Action Item Extraction** - Find tasks and follow-ups automatically

## 🔒 Security & Privacy

- **OAuth 2.0** - Secure Gmail authentication
- **Local Storage** - Credentials stored locally, never transmitted
- **Minimal Permissions** - Only requests necessary Gmail scopes
- **No Data Collection** - Your email data stays private

## 🐛 Troubleshooting

### Authentication Issues
```bash
# Clear existing auth and re-authenticate
gmail-mcp-server --setup:fresh

# Check current authentication status
gmail-mcp-server --check-auth
```

### Permission Errors
```bash
# On Unix systems, make executable
chmod +x /path/to/gmail-mcp-server

# On Windows, run as administrator if needed
```

### Connection Problems
1. Verify `credentials.json` exists
2. Check internet connection
3. Ensure Gmail API is enabled in Google Cloud Console
4. Verify OAuth consent screen is configured

## 📚 Documentation

- **Repository**: [GitHub](https://github.com/akhilpal/gmail-mcp-server)
- **Issues**: [Report bugs](https://github.com/akhilpal/gmail-mcp-server/issues)
- **Model Context Protocol**: [Official MCP Docs](https://modelcontextprotocol.io/)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Model Context Protocol](https://modelcontextprotocol.io/)
- Powered by [Gmail API](https://developers.google.com/gmail/api)
- AI features by [OpenAI](https://openai.com/)

---

**Made with ❤️ for the AI community**
