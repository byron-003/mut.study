# MUT Study Hub - Production Start Script
# This script builds the client and starts the server in production mode

Write-Host "🚀 MUT Study Hub - Production Build & Start" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

# Step 1: Build Client
Write-Host "📦 Step 1: Building client..." -ForegroundColor Yellow
Set-Location client
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Client build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Client built successfully!" -ForegroundColor Green
Write-Host ""

# Step 2: Set Production Environment
Write-Host "⚙️  Step 2: Setting production environment..." -ForegroundColor Yellow
Set-Location ../server

# Check if .env exists
if (!(Test-Path .env)) {
    Write-Host "❌ .env file not found in server directory!" -ForegroundColor Red
    Write-Host "Please create server/.env with production configuration" -ForegroundColor Red
    exit 1
}

# Backup current .env
$envContent = Get-Content .env
$hasProduction = $envContent | Select-String "NODE_ENV=production"

if (!$hasProduction) {
    Write-Host "⚠️  Warning: NODE_ENV is not set to 'production' in .env" -ForegroundColor Yellow
    Write-Host "The server will use development mode." -ForegroundColor Yellow
    Write-Host "To enable production mode, add 'NODE_ENV=production' to server/.env" -ForegroundColor Yellow
}

Write-Host ""

# Step 3: Start Server
Write-Host "🚀 Step 3: Starting server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "Server will start on http://localhost:5000" -ForegroundColor Cyan
Write-Host "Client will be served from the same port" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

node server.js
