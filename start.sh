#!/bin/bash

# Industrial IoT System - Setup & Start Script
# This script sets up and launches both backend and frontend servers

echo "=========================================="
echo "  Industrial IoT - System Initialization"
echo "=========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✓ Node.js detected: $(node --version)"
echo ""

# Backend setup
echo "📦 Setting up backend..."
cd backend || exit
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
else
    echo "✓ Backend dependencies already installed"
fi
echo ""

# Frontend setup
echo "📦 Setting up frontend..."
cd ../frontend || exit
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
else
    echo "✓ Frontend dependencies already installed"
fi
echo ""

# Start servers
echo "=========================================="
echo "  Starting Servers"
echo "=========================================="
echo ""
echo "🚀 Backend will start on http://localhost:3000"
echo "🚀 Frontend will start on http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Start backend in background
cd ../backend || exit
node app.js &
BACKEND_PID=$!

# Start frontend
cd ../frontend || exit
npm run dev &
FRONTEND_PID=$!

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
