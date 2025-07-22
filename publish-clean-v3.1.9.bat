@echo off
echo 🧹 Publishing CLEAN Gmail MCP CLI v3.1.9
echo.

echo ✅ Cleanup completed:
echo   - Moved templates/server-template-backup/ to backup-templates/
echo   - Moved templates/clean-server-template/ to backup-templates/
echo   - Only templates/server-template/ and quick-setup.js remain
echo.

echo 📋 Current templates structure:
dir templates /B

echo.
echo 🔨 Building clean CLI v3.1.9...
npm run build

if %ERRORLEVEL% neq 0 (
    echo ❌ Build failed!
    pause
    exit /b 1
)

echo.
echo 📦 Publishing clean version to NPM...
npm publish

if %ERRORLEVEL% neq 0 (
    echo ❌ Publish failed!
    pause
    exit /b 1
)

echo.
echo 🎉 SUCCESS! Clean version 3.1.9 published
echo.
echo 🧪 Test the clean fix with:
echo   npx gmail-mcp-cli@3.1.9 init
echo.
echo ✅ This should work without TypeScript errors!

pause
