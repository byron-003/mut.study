# MUT Study Hub - Production Setup Test Script
# This script verifies that everything is configured correctly for production

Write-Host "🔍 MUT Study Hub - Production Setup Verification" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""

$allGood = $true

# Test 1: Check if client dist exists
Write-Host "Test 1: Checking client build..." -ForegroundColor Yellow
if (Test-Path "client/dist/index.html") {
    Write-Host "✅ Client dist folder exists" -ForegroundColor Green
    Write-Host "   Location: client/dist/" -ForegroundColor Gray
} else {
    Write-Host "❌ Client dist folder not found" -ForegroundColor Red
    Write-Host "   Run: cd client && npm run build" -ForegroundColor Yellow
    $allGood = $false
}
Write-Host ""

# Test 2: Check server .env
Write-Host "Test 2: Checking server environment..." -ForegroundColor Yellow
if (Test-Path "server/.env") {
    Write-Host "✅ Server .env file exists" -ForegroundColor Green
    
    $envContent = Get-Content "server/.env"
    
    # Check NODE_ENV
    $nodeEnv = $envContent | Select-String "NODE_ENV=" | Select-Object -First 1
    if ($nodeEnv) {
        Write-Host "   NODE_ENV: $($nodeEnv.Line.Split('=')[1])" -ForegroundColor Gray
        if ($nodeEnv.Line -match "NODE_ENV=production") {
            Write-Host "   ✅ Set to production" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Not set to production (will use development mode)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ⚠️  NODE_ENV not found in .env" -ForegroundColor Yellow
    }
    
    # Check PORT
    $port = $envContent | Select-String "PORT=" | Select-Object -First 1
    if ($port) {
        Write-Host "   PORT: $($port.Line.Split('=')[1])" -ForegroundColor Gray
    }
    
    # Check DATABASE
    $dbHost = $envContent | Select-String "DB_HOST=" | Select-Object -First 1
    if ($dbHost) {
        Write-Host "   ✅ Database configured" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Database not configured" -ForegroundColor Red
        $allGood = $false
    }
} else {
    Write-Host "❌ Server .env file not found" -ForegroundColor Red
    Write-Host "   Create server/.env with production settings" -ForegroundColor Yellow
    $allGood = $false
}
Write-Host ""

# Test 3: Check client .env.production
Write-Host "Test 3: Checking client production config..." -ForegroundColor Yellow
if (Test-Path "client/.env.production") {
    Write-Host "✅ Client .env.production exists" -ForegroundColor Green
    
    $clientEnv = Get-Content "client/.env.production"
    $apiUrl = $clientEnv | Select-String "VITE_API_URL=" | Select-Object -First 1
    
    if ($apiUrl) {
        Write-Host "   API URL: $($apiUrl.Line.Split('=')[1])" -ForegroundColor Gray
        if ($apiUrl.Line -match "VITE_API_URL=/api") {
            Write-Host "   ✅ Using relative path (correct for production)" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Not using relative path" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "❌ Client .env.production not found" -ForegroundColor Red
    Write-Host "   This file should contain: VITE_API_URL=/api" -ForegroundColor Yellow
    $allGood = $false
}
Write-Host ""

# Test 4: Check server.js configuration
Write-Host "Test 4: Checking server.js configuration..." -ForegroundColor Yellow
if (Test-Path "server/server.js") {
    $serverJs = Get-Content "server/server.js" -Raw
    
    if ($serverJs -match "express\.static.*client/dist") {
        Write-Host "✅ Static file serving configured" -ForegroundColor Green
    } else {
        Write-Host "❌ Static file serving not configured" -ForegroundColor Red
        $allGood = $false
    }
    
    if ($serverJs -match "app\.get\('\*'") {
        Write-Host "✅ Catch-all route configured" -ForegroundColor Green
    } else {
        Write-Host "❌ Catch-all route not configured" -ForegroundColor Red
        $allGood = $false
    }
} else {
    Write-Host "❌ server/server.js not found" -ForegroundColor Red
    $allGood = $false
}
Write-Host ""

# Test 5: Check vite.config.js
Write-Host "Test 5: Checking Vite configuration..." -ForegroundColor Yellow
if (Test-Path "client/vite.config.js") {
    $viteConfig = Get-Content "client/vite.config.js" -Raw
    
    if ($viteConfig -match "build:.*outDir.*dist") {
        Write-Host "✅ Build output directory configured" -ForegroundColor Green
    }
    
    if ($viteConfig -match "base:.*'/'") {
        Write-Host "✅ Base path set correctly" -ForegroundColor Green
    }
} else {
    Write-Host "❌ client/vite.config.js not found" -ForegroundColor Red
    $allGood = $false
}
Write-Host ""

# Test 6: Check dependencies
Write-Host "Test 6: Checking dependencies..." -ForegroundColor Yellow
if (Test-Path "server/node_modules") {
    Write-Host "✅ Server dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Server dependencies not installed" -ForegroundColor Red
    Write-Host "   Run: cd server && npm install" -ForegroundColor Yellow
    $allGood = $false
}

if (Test-Path "client/node_modules") {
    Write-Host "✅ Client dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Client dependencies not installed" -ForegroundColor Red
    Write-Host "   Run: cd client && npm install" -ForegroundColor Yellow
    $allGood = $false
}
Write-Host ""

# Final Summary
Write-Host "================================================" -ForegroundColor Green
if ($allGood) {
    Write-Host "✅ All checks passed! Ready for production" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Review server/.env and set NODE_ENV=production" -ForegroundColor Gray
    Write-Host "2. Run: .\start-production.ps1" -ForegroundColor Gray
    Write-Host "3. Access: http://localhost:5000" -ForegroundColor Gray
} else {
    Write-Host "❌ Some checks failed. Please fix the issues above." -ForegroundColor Red
    Write-Host ""
    Write-Host "Quick fixes:" -ForegroundColor Cyan
    Write-Host "1. Build client: cd client && npm run build" -ForegroundColor Gray
    Write-Host "2. Configure .env files as needed" -ForegroundColor Gray
    Write-Host "3. Install dependencies: npm install in both client and server" -ForegroundColor Gray
}
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
