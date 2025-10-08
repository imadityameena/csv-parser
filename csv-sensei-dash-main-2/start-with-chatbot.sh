#!/bin/bash

echo "Starting CSV Sensei Dashboard with Chatbot Integration..."
echo

# Check if chatbot backend is running
echo "Checking if chatbot backend is running..."
if curl -s http://localhost:5000/health > /dev/null 2>&1; then
    echo "✅ Chatbot backend is running"
else
    echo
    echo "WARNING: Chatbot backend is not running on port 5000"
    echo "Please start the chatbot backend first:"
    echo "  npm run chatbot:dev"
    echo
    echo "Starting frontend anyway..."
fi

echo
echo "Starting frontend development server..."
echo "Frontend will be available at: http://localhost:8080"
echo "Chatbot API will be proxied through: http://localhost:8080/chatbot-api"
echo

npm run dev
