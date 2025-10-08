# 🚨 Quick Fix Guide - Blank Screen Issue

## Problem

The dashboard is showing a blank screen with the error:

```
Uncaught ReferenceError: process is not defined
at chatbotApi.ts:40:25
```

## Root Cause

The frontend is trying to access `process.env` which is not available in the browser environment.

## ✅ Solution Applied

I've fixed the issue by:

1. **Updated `src/lib/chatbotApi.ts`**:

   - Changed `process.env.VITE_CHATBOT_API_URL` to `import.meta.env.VITE_CHATBOT_API_URL`
   - Updated API URL to use proxy: `/chatbot-api/chat`

2. **Updated `vite.config.ts`**:
   - Added proxy configuration for chatbot API
   - Added environment variable definition
   - Frontend now runs on port 8080 (not 5173)

## 🚀 How to Start the Application

### Option 1: Use the new startup script

```bash
# Windows
start-with-chatbot.bat

# Linux/Mac
chmod +x start-with-chatbot.sh
./start-with-chatbot.sh
```

### Option 2: Manual startup

```bash
# Terminal 1: Start chatbot backend
npm run chatbot:dev

# Terminal 2: Start frontend
npm run dev
```

## 🌐 Access URLs

- **Frontend**: http://localhost:8080
- **Chatbot Backend**: http://localhost:5000
- **Chatbot API (via proxy)**: http://localhost:8080/chatbot-api

## 🔧 Environment Setup

Make sure you have a `.env` file in the `chatbot-backend` directory:

```env
OPENAI_API_KEY=your_openai_api_key_here
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:8080
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## ✅ Verification Steps

1. **Check chatbot backend**: http://localhost:5000/health
2. **Check frontend**: http://localhost:8080
3. **Look for chat button** in bottom-right corner of dashboard
4. **Test chatbot** by sending a message

## 🐛 If Still Having Issues

1. **Clear browser cache** and refresh
2. **Restart both servers** (frontend and chatbot backend)
3. **Check console** for any remaining errors
4. **Verify OpenAI API key** is set correctly

The blank screen issue should now be resolved! 🎉
