@echo off
echo 🚀 Gmail MCP CLI - Complete Fix and Publish
echo.

echo 📋 Current Git status:
git status
echo.

echo 📝 Adding all changes...
git add .
echo.

echo 💾 Committing changes...
git commit -m "fix: Add dual binary names (gmail-mcp and gmail-mcp-cli) and improve user docs

- Add both gmail-mcp and gmail-mcp-cli binary names for better UX
- Move type definitions to devDependencies for cleaner installs  
- Add prepublishOnly script to ensure builds before publishing
- Update README with clear installation instructions
- Add comprehensive troubleshooting section
- Fix user confusion with command names after npx install"

if %ERRORLEVEL% neq 0 (
    echo ❌ Git commit failed!
    pause
    exit /b 1
)
echo ✅ Changes committed successfully!
echo.

echo 📤 Pushing to GitHub...
git push origin master
if %ERRORLEVEL% neq 0 (
    echo ❌ Git push failed!
    pause
    exit /b 1
)
echo ✅ Pushed to GitHub successfully!
echo.

echo 🏷️ Bumping version...
npm version patch
if %ERRORLEVEL% neq 0 (
    echo ❌ Version bump failed!
    pause
    exit /b 1
)
echo ✅ Version bumped!
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

echo 🚀 Publishing to npm...
npm publish
if %ERRORLEVEL% neq 0 (
    echo ❌ Publish failed!
    pause
    exit /b 1
)
echo.

echo 🎉 SUCCESS! Package published successfully!
echo.
echo 📋 Updated package info:
npm info gmail-mcp-cli version
echo.
echo 🧪 Users can now test with:
echo    npx gmail-mcp-cli@latest
echo    gmail-mcp init
echo.
echo    OR
echo.  
echo    npm install -g gmail-mcp-cli
echo    gmail-mcp-cli init
echo.

pause
