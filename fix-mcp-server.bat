@echo off
echo 🔧 Fixing MCP Server Template and Publishing
echo.

echo 📋 Checking Git status...
git status
echo.

echo 📝 Adding server template fixes...
git add .
echo.

echo 💾 Committing MCP server fixes...
git commit -m "fix: Update server template with working MCP SDK patterns

- Fix TypeScript errors in server template index.ts
- Update to compatible MCP SDK version (1.0.7)
- Remove invalid setRequestHandler usage
- Add proper request.params handling
- Simplify server code to ensure compilation success
- Fixes build errors during gmail-mcp init"
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

echo ✅ SUCCESS! Fixed MCP server template published!
echo.
echo 📋 Tell users to try again:
echo    # Remove failed server directory
echo    rmdir /s /q server
echo    # Try with fixed version  
echo    npx gmail-mcp-cli@latest
echo    gmail-mcp init
echo.

pause
