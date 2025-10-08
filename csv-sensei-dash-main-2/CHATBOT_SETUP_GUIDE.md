# 🤖 CSV Sensei Chatbot Setup Guide

This guide will help you set up and run the AI-powered chatbot for your CSV Sensei Dashboard.

## 📋 Prerequisites

- Node.js 18+ installed
- OpenAI API key
- CSV Sensei Dashboard project

## 🚀 Quick Setup

### Step 1: Install Dependencies

```bash
# Install chatbot backend dependencies
npm run chatbot:install
```

### Step 2: Configure Environment

1. **Create `.env` file** in the `chatbot-backend` directory:

   ```bash
   cd chatbot-backend
   ```

2. **Add your OpenAI API key** to the `.env` file:

   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

   **Important**: Replace `your_openai_api_key_here` with your actual OpenAI API key.

### Step 3: Start the Services

**Option A: Using npm scripts (Recommended)**

```bash
# Terminal 1: Start chatbot backend
npm run chatbot:dev

# Terminal 2: Start frontend
npm run dev
```

**Option B: Using startup scripts**

```bash
# Windows
cd chatbot-backend
start.bat

# Linux/Mac
cd chatbot-backend
./start.sh
```

### Step 4: Test the Integration

1. **Open your browser** and go to `http://localhost:8080`
2. **Upload a CSV file** and navigate to any dashboard
3. **Look for the chat button** in the bottom-right corner
4. **Click the chat button** to open the chatbot
5. **Send a test message** like "Hello, can you help me analyze my data?"

## 🧪 Testing the Backend

Run the test script to verify everything is working:

```bash
cd chatbot-backend
node test-chatbot.js
```

Expected output:

```
🧪 Testing CSV Sensei Chatbot Backend...

1. Testing health check...
✅ Health check passed: healthy
   Services: { openai: 'connected', conversation: 'active' }

2. Testing chat health check...
✅ Chat health check passed: healthy
   OpenAI: connected

3. Testing message sending...
✅ Message sent successfully!
   Response: Hello! I'd be happy to help you understand your data...
   Conversation ID: conv_1234567890_abc123
   Tokens used: 150
   Processing time: 1200ms

4. Testing conversation retrieval...
✅ Conversation retrieved successfully!
   Messages count: 2
   Created at: 2024-01-15T10:30:00.000Z
```

## 🎯 Features Overview

### What the Chatbot Can Do

1. **Data Analysis Help**

   - Explain dashboard metrics and KPIs
   - Provide insights about your CSV data
   - Suggest data analysis approaches

2. **Context-Aware Responses**

   - Understands which dashboard you're viewing
   - Knows your data type (billing, compliance, doctor roster)
   - Provides industry-specific insights

3. **Interactive Features**
   - Real-time conversation
   - Message history during session
   - Minimizable chat window
   - Error handling and loading states

### Dashboard Integration

The chatbot is integrated into all major dashboards:

- **Business Intelligence Dashboard**: General data analysis
- **Compliance Dashboard**: Healthcare compliance insights
- **Billing Dashboard**: Revenue and billing analysis
- **Doctor Roster Dashboard**: Staff management insights

## 🔧 Configuration Options

### Backend Configuration

Edit `chatbot-backend/.env`:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4  # or gpt-3.5-turbo

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100  # requests per window
```

### Frontend Configuration

The chatbot automatically detects context, but you can customize it:

```tsx
<Chatbot
  context={{
    industry: "healthcare",
    dataType: "billing",
    currentDashboard: "billing",
  }}
/>
```

## 🐛 Troubleshooting

### Common Issues

**1. Chatbot not responding**

```
❌ Check if backend is running on port 5000
❌ Verify OpenAI API key is set correctly
❌ Check browser console for CORS errors
```

**2. OpenAI API errors**

```
❌ Verify your API key is valid
❌ Check your OpenAI account billing
❌ Ensure you have API access enabled
```

**3. CORS errors**

```
❌ Make sure FRONTEND_URL matches your frontend port
❌ Check if both services are running
```

**4. Rate limiting**

```
❌ You've exceeded the rate limit
❌ Wait 15 minutes or adjust RATE_LIMIT_MAX_REQUESTS
```

### Debug Mode

Enable detailed logging:

```env
NODE_ENV=development
```

Check the console for detailed error messages and API responses.

## 📊 Monitoring

### Health Checks

- **General Health**: `http://localhost:5000/health`
- **Chat Health**: `http://localhost:5000/api/chat/health`

### Logs

The backend provides structured logging:

- Request/response logs
- Error tracking
- Performance metrics
- Token usage statistics

## 🚀 Production Deployment

### Build for Production

```bash
# Build chatbot backend
npm run chatbot:build

# Build frontend
npm run build
```

### Environment Variables for Production

```env
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-domain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=50  # Lower for production
```

### Process Management

Use PM2 or similar for production:

```bash
# Install PM2
npm install -g pm2

# Start chatbot backend
cd chatbot-backend
pm2 start dist/index.js --name "csv-sensei-chatbot"

# Monitor
pm2 monit
```

## 🔒 Security Considerations

1. **API Key Protection**

   - Never expose OpenAI API key in frontend code
   - Use environment variables only
   - Consider using a proxy service for production

2. **Rate Limiting**

   - Configure appropriate limits for your use case
   - Monitor usage patterns
   - Consider implementing user-based rate limiting

3. **Input Validation**
   - All user input is validated and sanitized
   - Maximum message length: 2000 characters
   - Conversation history is limited to prevent token overflow

## 📈 Performance Tips

1. **Optimize API Usage**

   - Monitor token usage in responses
   - Consider using GPT-3.5-turbo for cost efficiency
   - Implement response caching for common queries

2. **Conversation Management**
   - Conversations are automatically cleaned up
   - History is limited to prevent memory issues
   - Consider implementing conversation persistence

## 🎨 Customization

### UI Customization

Modify the chatbot appearance in `src/components/Chatbot.tsx`:

```tsx
<Chatbot className="custom-chatbot-styles" context={context} />
```

### AI Behavior Customization

Modify the system message in `chatbot-backend/src/services/openaiService.ts` to change how the AI responds.

### Response Formatting

Customize how messages are displayed in the `renderMessage` function.

## 📞 Support

If you encounter issues:

1. **Check the logs** in the chatbot backend console
2. **Verify your OpenAI API key** and account status
3. **Test the health endpoints** to isolate issues
4. **Review the troubleshooting section** above

## 🎉 Success!

Once everything is working, you should see:

- ✅ Chatbot backend running on port 5000
- ✅ Frontend running on port 8080
- ✅ Chat button visible in dashboard
- ✅ AI responses to your messages
- ✅ Context-aware assistance

The chatbot is now ready to help users analyze their data and get insights from their CSV files!
