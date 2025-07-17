@echo off
echo 🧹 Cleaning up Gmail MCP CLI...

:: Remove any existing server directory
if exist "server" (
    echo 🗑️ Removing old server directory...
    rmdir /s /q "server"
)

:: Remove any build artifacts
if exist "dist" (
    echo 🗑️ Removing old build artifacts...
    rmdir /s /q "dist"
)

echo ✅ Cleanup complete!
echo 🔨 Building Gmail MCP CLI...

:: Build the CLI
npm run build

echo ✅ Build complete!
echo 🚀 Ready to test with: gmail-mcp init
