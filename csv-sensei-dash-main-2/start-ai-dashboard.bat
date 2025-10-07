@echo off
echo 🚀 Starting CSV Sensei Dashboard with AI Assistant...
echo.

echo 📦 Installing dependencies...
call npm install

echo.
echo 🤖 Training AI Agent...
call npm run ai:train

echo.
echo 🧪 Testing AI System...
call npm run ai:test

echo.
echo 🚀 Starting Backend Server...
start "Backend Server" cmd /k "npm run server:dev"

echo.
echo ⏳ Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo.
echo 🌐 Starting Frontend...
start "Frontend" cmd /k "npm run dev"

echo.
echo ✅ CSV Sensei Dashboard with AI Assistant is starting!
echo 📊 Backend: http://localhost:4000
echo 🌐 Frontend: http://localhost:5173
echo.
echo Press any key to exit...
pause > nul
