@echo off
echo 🚀 Building and Publishing Gmail MCP CLI v3.1.8
echo.

echo 📁 Current directory: %CD%
echo.

echo 📋 Verifying project structure...
if exist "templates\server-template\src\index.js" (
    echo ✅ Fixed JavaScript template found
) else (
    echo ❌ Fixed template not found!
    pause
    exit /b 1
)

if exist "server-backup-old" (
    echo ✅ Old broken server moved to backup
) else (
    echo ❌ Old server not backed up properly
)

echo.
echo 🔨 Building CLI...
npm run build

if %ERRORLEVEL% neq 0 (
    echo ❌ Build failed!
    pause
    exit /b 1
)

echo.
echo ✅ Build successful!
echo.

echo 📦 Publishing to NPM...
npm publish

if %ERRORLEVEL% neq 0 (
    echo ❌ Publish failed!
    pause
    exit /b 1
)

echo.
echo 🎉 SUCCESS! Version 3.1.8 published to NPM
echo.
echo 🧪 Test the fix with:
echo   npx gmail-mcp-cli@3.1.8 init
echo.

pause
