@echo off
echo 🚀 Gmail MCP CLI - Build & Publish Fix v3.1.7
echo.

echo 📦 Building updated CLI...
npm run build

echo.
echo 📋 Current template structure:
dir templates\server-template /B

echo.
echo 🎯 Key fixes in v3.1.7:
echo   ✅ Fixed server template - pure JavaScript (no TypeScript compilation)
echo   ✅ Updated MCP SDK to v1.15.1 (was v0.5.0)
echo   ✅ Correct ES6 module syntax
echo   ✅ No build step required
echo   ✅ Working package.json with right dependencies
echo.

echo 🚀 Publishing to NPM...
npm publish

echo.
echo ✅ Done! Users can now run:
echo   npx gmail-mcp-cli@3.1.7 init
echo.
echo 📋 This should fix the TypeScript compilation errors!

pause
