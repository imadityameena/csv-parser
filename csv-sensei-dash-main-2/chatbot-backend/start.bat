@echo off
echo Starting CSV Sensei Chatbot Backend...
echo.

REM Check if .env file exists
if not exist .env (
    echo ERROR: .env file not found!
    echo Please create a .env file with your OpenAI API key.
    echo Example:
    echo OPENAI_API_KEY=your_openai_api_key_here
    echo PORT=5000
    echo NODE_ENV=development
    echo FRONTEND_URL=http://localhost:5173
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist node_modules (
    echo Installing dependencies...
    npm install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Start the development server
echo Starting chatbot backend on port 5000...
npm run dev
