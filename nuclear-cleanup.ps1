# Aggressive Gmail MCP CLI Cleanup Script
# Removes ALL unnecessary files from the project directory

Write-Host "AGGRESSIVE cleanup of Gmail MCP CLI directory..." -ForegroundColor Red

# Navigate to project directory  
Set-Location "C:\Users\akhil\Documents\projects\gmail-mcp-cli"

Write-Host "Current directory: $PWD" -ForegroundColor Gray

# Remove ALL .bat files
Write-Host "Removing ALL batch files..." -ForegroundColor Yellow
Get-ChildItem -Path "*.bat" -ErrorAction SilentlyContinue | ForEach-Object { 
    Remove-Item $_.FullName -Force
    Write-Host "  Removed: $($_.Name)" -ForegroundColor Red 
}

# Remove ALL guide and documentation files
Write-Host "Removing ALL guide files..." -ForegroundColor Yellow
$allDocsToRemove = @(
    "*.md"
)

foreach ($pattern in $allDocsToRemove) {
    Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue | Where-Object { 
        $_.Name -ne "README.md" 
    } | ForEach-Object {
        Remove-Item $_.FullName -Force
        Write-Host "  Removed: $($_.Name)" -ForegroundColor Red
    }
}

# Remove ALL specific files
Write-Host "Removing specific unnecessary files..." -ForegroundColor Yellow
$filesToRemove = @(
    "repomix-output.xml",
    "server-package.json", 
    "package-lock.json",
    "tsconfig.json",
    "test-deployment.js",
    "cleanup.ps1",
    "cleanup-fixed.ps1",
    "gmail-mcp.json",
    ".env",
    "*.log"
)

foreach ($pattern in $filesToRemove) {
    Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue | ForEach-Object {
        Remove-Item $_.FullName -Force
        Write-Host "  Removed: $($_.Name)" -ForegroundColor Red
    }
}

# Remove ALL backup and unnecessary directories
Write-Host "Removing ALL unnecessary directories..." -ForegroundColor Yellow
$dirsToRemove = @(
    "backup-files",
    "backup-templates", 
    "server-backup-old",
    "server",
    "node_modules",
    "dist"
)

foreach ($dir in $dirsToRemove) {
    if (Test-Path $dir) {
        Remove-Item $dir -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  Removed directory: $dir" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "AGGRESSIVE cleanup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Final project structure:" -ForegroundColor Cyan

# Show what's left
Get-ChildItem -Name | Sort-Object | ForEach-Object {
    Write-Host "  $($_)" -ForegroundColor Green
}

Write-Host ""
Write-Host "Your project is now CLEAN!" -ForegroundColor Green
Write-Host "Only essential files remain for publishing." -ForegroundColor Gray
