# Gmail MCP Server - Official Style Installation

## Installation (Like Official MCP Servers)

### Option 1: NPX (Easiest)
```bash
npx @akhilpal/gmail-mcp-server init
```

### Option 2: Global Install
```bash
npm install -g @akhilpal/gmail-mcp-server
gmail-mcp-server
```

### Option 3: Manual Configuration (Like Supabase/GitHub MCP)

1. Install the server:
```bash
npm install @akhilpal/gmail-mcp-server
```

2. Add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "gmail": {
      "command": "node",
      "args": ["node_modules/@akhilpal/gmail-mcp-server/dist/index.js"]
    }
  }
}
```

## Comparison with Official Servers

| Server | Installation | Config |
|--------|-------------|---------|
| **Supabase MCP** | `npm install @modelcontextprotocol/server-supabase` | Manual |
| **GitHub MCP** | `npm install @modelcontextprotocol/server-github` | Manual |
| **Gmail MCP** | `npm install @akhilpal/gmail-mcp-server` | Manual or Auto |

## Features
- ✅ 17 Gmail tools
- ✅ Production-ready
- ✅ TypeScript
- ✅ Full MCP compliance
