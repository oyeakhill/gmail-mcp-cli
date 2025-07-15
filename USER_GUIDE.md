# Gmail MCP CLI - User Installation Guide

## 🚀 Quick Start (5 minutes)

### Step 1: Initialize Gmail MCP Server
Open your terminal and run:
```bash
npx gmail-mcp-cli init
```

You'll be prompted for:
- **Project name**: Press Enter (uses default: gmail-mcp-server)
- **Deployment target**: Select "Local Development (Claude Desktop)"
- **OpenAI API key**: Enter your key or press Enter to skip (optional)

### Step 2: Authenticate with Gmail
The CLI will automatically:
1. Open your browser for Gmail authentication
2. Ask you to sign in to your Google account
3. Request permission to access Gmail
4. Save credentials locally (you only do this once)

### Step 3: Deploy to Claude Desktop
```bash
npx gmail-mcp-cli deploy
```

This automatically:
- Builds the Gmail MCP server
- Updates your Claude Desktop configuration
- Makes 17 Gmail tools available in Claude

### Step 4: Restart Claude Desktop
- Close Claude Desktop completely
- Open Claude Desktop again
- The Gmail tools are now available!

### Step 5: Test Your Gmail Tools
Try these commands in Claude Desktop:

```
"List my email subscriptions"
"Show me emails from the last 24 hours"
"Search for emails with invoices"
"Draft a professional reply to my latest email"
"Create a Gmail label called 'Important'"
```

## 📋 Complete Tool List

Once installed, you can use these 17 tools in Claude:

1. **gmail_search** - Search emails with Gmail queries
2. **gmail_read** - Read specific emails by ID
3. **gmail_send** - Send new emails
4. **gmail_draft** - Create email drafts
5. **gmail_reply** - Reply to emails
6. **gmail_forward** - Forward emails
7. **gmail_labels** - Manage Gmail labels
8. **gmail_trash** - Move emails to trash
9. **gmail_unread** - Mark emails as unread
10. **gmail_star** - Star important emails
11. **gmail_attachments** - Handle email attachments
12. **gmail_filters** - Create email filters
13. **gmail_statistics** - Get email statistics
14. **gmail_subscriptions** - Manage subscriptions
15. **gmail_compose_ai** - AI-powered email composition
16. **gmail_summarize** - Summarize long emails
17. **gmail_analyze** - Analyze email patterns

## 🔧 Troubleshooting

### "Gmail authentication failed"
- Make sure you're signed into the correct Google account
- Check if the app is in test mode (contact developer)

### "Claude Desktop doesn't show Gmail tools"
- Verify Claude Desktop is fully closed before restarting
- Check the config file was updated: `%APPDATA%\Roaming\Claude\claude_desktop_config.json`
- Run `npx gmail-mcp-cli status` to verify installation

### "OpenAI features not working"
- The OpenAI API key is optional
- To add it later: Run `npx gmail-mcp-cli init` again

## 💡 Example Use Cases

### Managing Subscriptions
```
User: "Show me all my email subscriptions"
Claude: [Uses gmail_subscriptions tool to list all subscriptions]

User: "Unsubscribe me from marketing emails"
Claude: [Helps identify and manage unwanted subscriptions]
```

### Email Analysis
```
User: "Analyze my emails from this week for urgent items"
Claude: [Uses gmail_analyze to identify priority emails]

User: "Summarize the long email from John"
Claude: [Uses gmail_summarize to provide concise summary]
```

### Professional Communication
```
User: "Draft a professional response to the client's proposal"
Claude: [Uses gmail_compose_ai to create polished email]

User: "Send a follow-up to everyone who hasn't replied"
Claude: [Searches unreplied emails and helps compose follow-ups]
```

## 🔒 Privacy & Security

- ✅ All emails processed locally on your device
- ✅ No email content sent to external servers
- ✅ OAuth tokens stored in Claude Desktop config
- ✅ Direct Gmail API connection
- ✅ Optional AI features (can be disabled)

## 📞 Support

- Issues: https://github.com/oyeakhill/gmail-mcp-cli/issues
- Email: palakhil197@gmail.com
- NPM: https://www.npmjs.com/package/gmail-mcp-cli
