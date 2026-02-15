#!/bin/bash

# Set strict error handling
set -e

# Function to cleanup background processes on exit
cleanup() {
    echo "Shutting down..."
    # Kill all child processes of this script
    pkill -P $$
    exit 0
}

# Trap exit signals
trap cleanup SIGINT SIGTERM EXIT

echo "🚀 Starting Traffic Creator Development Environment..."

# 1. Start Backend
echo "-----------------------------------"
echo "📁 Setting up Backend..."
cd backend

if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

echo "🔌 Activating virtual environment..."
source venv/bin/activate

echo "📦 Installing dependencies..."
pip install -r requirements.txt > /dev/null 2>&1

echo "✨ Starting Backend Server (Port 8001)..."
# using uvicorn directly assuming it's in requirements
uvicorn main:app --reload --port 8001 --host 0.0.0.0 &
BACKEND_PID=$!

# Wait a moment for backend to initialize
sleep 2

# 2. Start Frontend
echo "-----------------------------------"
echo "📁 Setting up Frontend..."
cd ../frontend

if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node dependencies..."
    npm install
fi

echo "✨ Starting Frontend Server..."
npm run dev -- --host &
FRONTEND_PID=$!

echo "-----------------------------------"
echo "✅ Environment Running!"
echo "🌍 Frontend: http://localhost:5173"
echo "🔌 Backend:  http://localhost:8001"
echo "-----------------------------------"
echo "Press Ctrl+C to stop all services"

# Wait for both processes to keep script running
wait $BACKEND_PID $FRONTEND_PID
