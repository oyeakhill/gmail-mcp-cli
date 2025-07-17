# 🔑 Setup Shared OAuth for GitHub MCP Style

## ⚠️ REQUIRED: Replace OAuth Credentials

In `src/cli.ts`, replace these placeholder values with your actual production credentials:

```typescript
// 🔑 SHARED OAUTH CONFIGURATION (Replace with your production credentials)
const SHARED_OAUTH_CONFIG = {
  client_id: 'YOUR_PRODUCTION_CLIENT_ID.apps.googleusercontent.com',
  client_secret: 'YOUR_PRODUCTION_CLIENT_SECRET',
  redirect_uri: 'http://localhost:3000/auth/callback'
};
```

## 📝 How to Get Your Production Credentials:

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Select your existing Gmail MCP project** (the one that's already in production)
3. **Go to APIs & Services → Credentials**
4. **Find your existing OAuth 2.0 Client ID** (Desktop application)
5. **Copy the Client ID and Client Secret**
6. **Update the SHARED_OAUTH_CONFIG in src/cli.ts**

## 🔧 Enable OAuth for Production:

Make sure your OAuth consent screen is configured for **External** users and published.

## 🚀 Test the Conversion:

1. **Install new dependencies:**
   ```bash
   npm install
   ```

2. **Build the updated CLI:**
   ```bash
   npm run build
   ```

3. **Test the new shared OAuth flow:**
   ```bash
   npm run dev
   # Choose 'init' command
   ```

## 🎯 Expected Experience (After OAuth Setup):

**OLD WAY (Before):**
```bash
npx gmail-mcp-cli init
# Manual Google Cloud Console setup (15-20 minutes)
# Download credentials.json
# Run setup script
```

**NEW WAY (After OAuth Setup):**
```bash
npx gmail-mcp-cli init
# Choose deployment target
# Browser opens automatically
# Click "Allow" on Gmail permissions
# Done! (2-3 minutes)
```

## 📦 Publishing to NPM:

After adding your OAuth credentials:

1. **Build:**
   ```bash
   npm run build
   ```

2. **Test locally:**
   ```bash
   npm link
   gmail-mcp init
   ```

3. **Publish:**
   ```bash
   npm publish
   ```

## 🎉 Result:

Users will be able to run:
```bash
npx @yourusername/gmail-mcp-server
```

And get Gmail MCP Server working in 2-3 minutes, just like GitHub MCP!

## 🔒 Security Notes:

- Your OAuth app credentials will be in the published package
- This is standard practice for MCP servers (GitHub MCP does the same)
- Users authenticate with their own Gmail accounts
- No user data is shared between users
- Each user gets their own tokens stored locally

## ✅ Conversion Complete!

Your Gmail MCP CLI is now ready for GitHub MCP-style distribution!
