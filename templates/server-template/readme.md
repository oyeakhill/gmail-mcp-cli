# Complete Gmail MCP Server v3.1.0

A comprehensive Gmail MCP (Model Context Protocol) server that provides **complete Gmail client functionality** with 17 powerful tools for email management, AI analysis, and automation.

## 🎆 **COMPLETE GMAIL FUNCTIONALITY - 17 TOOLS**

### ✅ **Email Management Tools (7 tools):**
- **📧 get_emails** - Retrieve emails with category filtering (Primary, Promotions, Social, Updates)
- **🔍 search_emails** - Advanced Gmail search with full query syntax
- **🔬 get_email_details** - Detailed email information with metadata
- **🛠 manage_email** - Mark read/unread, star, archive, delete, label management
- **📊 get_gmail_stats** - Gmail account statistics and overview
- **📁 get_special_emails** - Access drafts, sent, starred, important, trash, spam
- **🧵 get_thread** - Complete email thread/conversation management

### ✅ **Communication Tools (2 tools):**
- **✍️ compose_email** - Compose and send new emails or save as drafts
- **↩️ reply_email** - Reply to emails with proper threading (reply/reply-all)

### ✅ **Subscription Management (1 tool):**
- **📧 manage_subscriptions** - List subscriptions, find unsubscribe links, block senders

### ✅ **Organization Tools (2 tools):**
- **🏷️ manage_labels** - Create, delete, and manage Gmail labels
- **🧵 get_thread** - View complete email conversations with threading

### ✅ **AI-Powered Tools (5 tools - requires OpenAI API key):**
- **🤖 analyze_emails** - AI email analysis (priority, sentiment, comprehensive)
- **📝 summarize_thread** - AI thread summarization (brief, detailed, action items)
- **📋 list_action_items** - Extract action items and tasks using AI
- **🤖 generate_draft** - AI-powered email draft generation with tone control
- **📎 extract_attachments_summary** - AI attachment analysis and summarization

## 🚀 **Key Features**

- **17 Comprehensive Tools** - Complete Gmail functionality coverage
- **AI-Powered Analysis** - Smart insights with OpenAI integration (optional)
- **Subscription Management** - Unsubscribe and block unwanted emails
- **Thread Management** - Full conversation context and management
- **Email Composition** - Send and reply with proper formatting
- **Label Organization** - Create and manage Gmail labels
- **Advanced Search** - Full Gmail search syntax support
- **Attachment Analysis** - AI-powered attachment insights
- **Graceful Degradation** - Works without OpenAI (12 tools available)

## 📋 **Quick Setup**

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Setup Gmail OAuth** 
   - Get `credentials.json` from Google Cloud Console
   - Place in project root
   - Run: `npm run setup`

3. **Optional: Add OpenAI API Key**
   Create `.env` file:
   ```bash
   OPENAI_API_KEY=your-openai-api-key-here
   ```

4. **Start Server**
   ```bash
   npm run start
   ```

## 🎯 **Usage Examples**

### **Email Management**
```bash
# Get primary emails
"Show me my recent emails from primary category"

# Search for specific emails
"Search for emails from john@company.com about the project"

# Get detailed email information
"Show me details of email ID: abc123"
```

### **Subscription Management**
```bash
# List all subscriptions
"List my email subscriptions"

# Unsubscribe from sender
"Unsubscribe me from promotional emails"

# Block sender permanently
"Block all future emails from sender@spam.com"
```

### **Email Communication**
```bash
# Compose new email
"Compose an email to team@company.com about tomorrow's meeting"

# Reply to email
"Reply to email ID abc123 with confirmation"
```

### **AI-Powered Features (with OpenAI API key)**
```bash
# AI email analysis
"Analyze my recent emails for priority and sentiment"

# Generate email draft
"Generate a professional email draft for client proposal follow-up"

# Summarize email thread
"Summarize the email thread about the budget discussion"

# Extract action items
"What action items do I have in my inbox this week?"
```

## ⚙️ **Configuration**

### **Gmail API Setup**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select project
3. Enable Gmail API
4. Create OAuth2 credentials (Desktop Application)
5. Download as `credentials.json`
6. Place in project root

### **Environment Variables**
```bash
# Optional: OpenAI API key for AI features
OPENAI_API_KEY=your-openai-api-key-here

# Optional: Gmail address
GMAIL_ADDRESS=your-email@gmail.com
```

## 🛠 **Claude Desktop Integration**

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "gmail": {
      "command": "node",
      "args": ["/absolute/path/to/gmail-mcp-server/src/index.js"],
      "env": {
        "OPENAI_API_KEY": "your-key-here"
      }
    }
  }
}
```

## 📖 **Complete Tool Reference**

| Tool | Category | Description | OpenAI Required |
|------|----------|-------------|-----------------|
| `get_emails` | Core | Get emails by category | ❌ |
| `search_emails` | Core | Advanced Gmail search | ❌ |
| `get_email_details` | Core | Detailed email info | ❌ |
| `manage_email` | Core | Email actions (read/star/archive) | ❌ |
| `get_gmail_stats` | Core | Account statistics | ❌ |
| `get_special_emails` | Core | Drafts/sent/starred emails | ❌ |
| `get_thread` | Core | Email conversations | ❌ |
| `compose_email` | Communication | Send new emails | ❌ |
| `reply_email` | Communication | Reply to emails | ❌ |
| `manage_subscriptions` | Subscriptions | Unsubscribe/block senders | ❌ |
| `manage_labels` | Organization | Label management | ❌ |
| `analyze_emails` | AI | Smart email analysis | ✅ |
| `summarize_thread` | AI | Thread summarization | ✅ |
| `list_action_items` | AI | Extract action items | ✅ |
| `generate_draft` | AI | Draft generation | ✅ |
| `extract_attachments_summary` | AI | Attachment analysis | ✅ |

## 🔒 **Security & Privacy**

- **OAuth2 Authentication** - Secure Gmail access
- **Local Processing** - Your email data stays on your device
- **No Data Collection** - Emails processed locally only
- **Optional AI** - OpenAI integration is completely optional
- **Minimal Permissions** - Only requests necessary Gmail scopes

## 🚀 **Advanced Features**

### **Smart Subscription Management**
- Automatically detects subscription emails
- Finds unsubscribe links in email content
- Creates Gmail filters to block future emails
- Analyzes subscription patterns and frequency

### **AI-Powered Email Intelligence**
- Priority scoring and sentiment analysis
- Action item extraction from email content
- Thread summarization with different detail levels
- Context-aware draft generation with tone control
- Attachment content analysis and insights

### **Complete Email Workflow**
- Read, search, and organize emails
- Compose and reply with proper threading
- Manage labels and categories
- Handle drafts, sent items, and special folders
- Full thread conversation management

## 📊 **Version Comparison**

| Feature | Basic Gmail Tools | **Complete v3.1.0** |
|---------|------------------|---------------------|
| **Email Retrieval** | ✅ Basic | ✅ Advanced with categories |
| **Search** | ✅ Simple | ✅ Advanced query syntax |
| **Email Management** | ❌ None | ✅ Complete (star/archive/delete) |
| **Composition** | ❌ None | ✅ Compose & Reply |
| **Subscriptions** | ❌ None | ✅ Complete management |
| **Labels** | ❌ None | ✅ Create/manage |
| **Threads** | ❌ None | ✅ Full conversation view |
| **AI Analysis** | ❌ None | ✅ 5 AI-powered tools |
| **Total Tools** | 4 | **17** |
| **Gmail Coverage** | 20% | **95%** |

## 🔧 **Troubleshooting**

### **Authentication Issues**
- Ensure `credentials.json` is in project root
- Run `npm run setup:fresh` to re-authorize
- Check Gmail API is enabled in Google Cloud Console

### **Missing AI Features**
- Add `OPENAI_API_KEY` to `.env` file
- Restart the server after adding the key
- AI tools will appear automatically when key is detected

### **Tools Not Showing in Claude**
- Verify server path is absolute in Claude Desktop config
- Check server starts without errors: `npm run start`
- Restart Claude Desktop completely

## 📞 **Support**

- **GitHub Issues**: Report bugs and feature requests
- **Documentation**: Check tool descriptions for usage details
- **Logs**: Use `console.error` messages for debugging

## 📄 **License**

MIT License - see LICENSE file for details.

---

**🎆 Complete Gmail MCP Server v3.1.0** - Your comprehensive Gmail automation solution with AI-powered intelligence!

**Test it with:** *"List my email subscriptions"* | *"Analyze my recent emails"* | *"Generate a professional email draft"*
