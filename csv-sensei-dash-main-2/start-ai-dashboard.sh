#!/bin/bash

echo "🚀 Starting CSV Sensei Dashboard with AI Assistant..."
echo

echo "📦 Installing dependencies..."
npm install

echo
echo "🤖 Training AI Agent..."
npm run ai:train

echo
echo "🧪 Testing AI System..."
npm run ai:test

echo
echo "🚀 Starting Backend Server..."
gnome-terminal -- bash -c "npm run server:dev; exec bash" 2>/dev/null || \
xterm -e "npm run server:dev" 2>/dev/null || \
osascript -e 'tell app "Terminal" to do script "cd '$(pwd)' && npm run server:dev"' 2>/dev/null || \
echo "Please start the backend manually: npm run server:dev"

echo
echo "⏳ Waiting for backend to start..."
sleep 5

echo
echo "🌐 Starting Frontend..."
gnome-terminal -- bash -c "npm run dev; exec bash" 2>/dev/null || \
xterm -e "npm run dev" 2>/dev/null || \
osascript -e 'tell app "Terminal" to do script "cd '$(pwd)' && npm run dev"' 2>/dev/null || \
echo "Please start the frontend manually: npm run dev"

echo
echo "✅ CSV Sensei Dashboard with AI Assistant is starting!"
echo "📊 Backend: http://localhost:4000"
echo "🌐 Frontend: http://localhost:5173"
echo
echo "Press Enter to exit..."
read
