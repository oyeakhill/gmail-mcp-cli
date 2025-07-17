@echo off
echo 🔧 Gmail MCP CLI - Publishing Fix
echo.

echo ✅ Checking Node.js version...
node --version
echo.

echo 🔨 Building project...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo ❌ Build failed!
    pause
    exit /b 1
)
echo ✅ Build successful!
echo.

echo 📦 Testing package locally...
npm link
echo.

echo 🧪 Testing commands...
echo Testing: gmail-mcp --version
gmail-mcp --version
echo.
echo Testing: gmail-mcp-cli --version  
gmail-mcp-cli --version
echo.

echo 🚀 Ready to publish! Run one of these:
echo    npm version patch    (for bug fixes)
echo    npm version minor    (for new features)  
echo    npm version major    (for breaking changes)
echo.
echo Then run: npm publish
echo.

pause
