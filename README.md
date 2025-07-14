# Gmail MCP CLI

A Model Context Protocol (MCP) server that enables Claude Desktop to interact with Gmail through a simple NPX command.

## Features

- 📧 Read and search Gmail messages
- 📝 Draft and send emails
- 🏷️ Manage labels and folders
- 🔍 Advanced email search capabilities
- 🤖 AI-powered email analysis (optional)

## Installation

No installation required! Simply run with NPX:

```bash
npx gmail-mcp-cli
```

## Setup

### 1. Configure Claude Desktop

Add the Gmail MCP server to your Claude Desktop configuration:

**Windows**: `%APPDATA%\Roaming\Claude\claude_desktop_config.json`
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "gmail": {
      "command": "npx",
      "args": ["gmail-mcp-cli"]
    }
  }
}
```

### 2. First-time Authentication

When you first run the server, it will:
1. Open your browser for Gmail authentication
2. Request necessary permissions
3. Store credentials locally for future use

## Usage

Once configured, you can use these tools in Claude Desktop:

- **gmail_search**: Search emails with queries like "from:john@example.com subject:invoice"
- **gmail_read**: Read specific emails by ID
- **gmail_send**: Send new emails
- **gmail_draft**: Create email drafts
- **gmail_labels**: Manage Gmail labels

## Privacy & Security

- All email processing happens locally on your device
- OAuth tokens are stored securely in your local configuration
- No email data is sent to external servers
- Optional AI features use OpenAI API (configurable)

## Support

For issues or questions: palakhil197@gmail.com

## License

MIT License - see LICENSE file for details
