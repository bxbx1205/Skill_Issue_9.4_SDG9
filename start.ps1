# Industrial IoT System - Windows PowerShell Setup & Start Script

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Industrial IoT - System Initialization" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

$nodeVersion = node --version
Write-Host "✓ Node.js detected: $nodeVersion" -ForegroundColor Green
Write-Host ""

# Backend setup
Write-Host "📦 Setting up backend..." -ForegroundColor Yellow
Set-Location backend
if (!(Test-Path "node_modules")) {
    Write-Host "Installing backend dependencies..."
    npm install
} else {
    Write-Host "✓ Backend dependencies already installed" -ForegroundColor Green
}
Write-Host ""

# Frontend setup
Write-Host "📦 Setting up frontend..." -ForegroundColor Yellow
Set-Location ../frontend
if (!(Test-Path "node_modules")) {
    Write-Host "Installing frontend dependencies..."
    npm install
} else {
    Write-Host "✓ Frontend dependencies already installed" -ForegroundColor Green
}
Write-Host ""

# Start servers
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Starting Servers" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 Backend: http://localhost:3000" -ForegroundColor Green
Write-Host "🚀 Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop all servers" -ForegroundColor Yellow
Write-Host ""

# Start backend in new window
$backendJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; node app.js" -PassThru

# Start frontend in current window
Set-Location ../frontend
npm run dev

# Cleanup on exit
Stop-Process -Id $backendJob.Id -ErrorAction SilentlyContinue
