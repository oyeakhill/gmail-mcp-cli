@echo off
echo 🚨 CRITICAL FIX v3.1.8 - Remove broken server directory
echo.

echo 📋 Problem identified:
echo   ❌ NPM package included BOTH server/ and templates/server-template/
echo   ❌ CLI was copying from wrong location (broken server/ instead of fixed templates/)
echo   ❌ server/ contained old TypeScript files with wrong MCP SDK syntax
echo.

echo ✅ Fixes applied:
echo   ✅ Removed "server/**/*" from package.json files array
echo   ✅ Only "templates/**/*" included now
echo   ✅ Moved old server/ to server-backup-old/
echo   ✅ Updated version to 3.1.8
echo.

echo 🔨 Building fixed CLI...
npm run build

echo.
echo 📦 Publishing critical fix v3.1.8...
npm publish

echo.
echo ✅ PUBLISHED! Users should now run:
echo   npx gmail-mcp-cli@3.1.8 init
echo.
echo 🎯 This should fix the TypeScript compilation errors!

pause
