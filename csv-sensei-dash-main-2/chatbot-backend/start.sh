#!/bin/bash

echo "Starting CSV Sensei Chatbot Backend..."
echo

# Check if .env file exists
if [ ! -f .env ]; then
    echo "ERROR: .env file not found!"
    echo "Please create a .env file with your OpenAI API key."
    echo "Example:"
    echo "OPENAI_API_KEY=your_openai_api_key_here"
    echo "PORT=5000"
    echo "NODE_ENV=development"
    echo "FRONTEND_URL=http://localhost:5173"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d node_modules ]; then
    echo "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install dependencies"
        exit 1
    fi
fi

# Start the development server
echo "Starting chatbot backend on port 5000..."
npm run dev
