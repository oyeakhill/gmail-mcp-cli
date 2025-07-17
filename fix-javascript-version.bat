@echo off
echo 🔧 Publishing JavaScript-based MCP Server Fix
echo.

echo 📋 Checking Git status...
git status
echo.

echo 📝 Adding JavaScript server template...
git add .
echo.

echo 💾 Committing JavaScript MCP server...
git commit -m "fix: Replace TypeScript server with working JavaScript version

- Convert server template from TypeScript to JavaScript  
- Use CommonJS instead of ES modules for better compatibility
- Simplify build process to avoid TypeScript compilation issues
- Update MCP SDK to stable version 0.5.0
- Fixes all TypeScript build errors during gmail-mcp init"
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

echo 🌐 Pushing to GitHub...
git push origin master
echo.

echo ✅ SUCCESS! JavaScript-based MCP server published!
echo.
echo 📋 Tell users to try again:
echo    # Remove failed server directory
echo    rmdir /s /q server
echo    # Update to latest version  
echo    npm update -g gmail-mcp-cli
echo    # Try with fixed version
echo    gmail-mcp init
echo.

pause
