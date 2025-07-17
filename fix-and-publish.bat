@echo off
echo 🔧 Fixing Server Template and Publishing Update
echo.

echo 📋 Checking Git status...
git status
echo.

echo 📝 Adding template fixes...
git add .
echo.

echo 💾 Committing server template fixes...
git commit -m "fix: Remove incorrect CLI files from server template

- Remove src/cli.ts from server template (contains CLI deps not needed in server)
- Remove backup files that were causing build errors  
- Server template now only contains correct MCP server files
- Fixes build errors when users run gmail-mcp init"
echo.

echo 🏷️ Bumping version...
npm version patch
if %ERRORLEVEL% neq 0 (
    echo ❌ Version bump failed!
    pause
    exit /b 1
)
echo.

echo 🔨 Building project...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo ❌ Build failed!
    pause
    exit /b 1
)
echo.

echo 🚀 Publishing to npm...
npm publish
if %ERRORLEVEL% neq 0 (
    echo ❌ Publish failed!
    pause
    exit /b 1
)
echo.

echo ✅ SUCCESS! Fixed version published!
echo.
echo 📋 Tell users to try again:
echo    npx gmail-mcp-cli@latest
echo    gmail-mcp init
echo.

pause
