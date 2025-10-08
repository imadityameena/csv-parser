@echo off
echo Starting CSV Sensei Dashboard with Chatbot Integration...
echo.

REM Check if chatbot backend is running
echo Checking if chatbot backend is running...
curl -s http://localhost:5000/health >nul 2>&1
if errorlevel 1 (
    echo.
    echo WARNING: Chatbot backend is not running on port 5000
    echo Please start the chatbot backend first:
    echo   npm run chatbot:dev
    echo.
    echo Starting frontend anyway...
) else (
    echo ✅ Chatbot backend is running
)

echo.
echo Starting frontend development server...
echo Frontend will be available at: http://localhost:8080
echo Chatbot API will be proxied through: http://localhost:8080/chatbot-api
echo.

npm run dev
