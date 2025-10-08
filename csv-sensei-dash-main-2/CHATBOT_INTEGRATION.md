# CSV Sensei Chatbot Integration

This document describes the AI-powered chatbot integration for the CSV Sensei Dashboard, providing intelligent assistance for data analysis and business intelligence.

## 🚀 Quick Start

### 1. Install Chatbot Dependencies

```bash
# Install chatbot backend dependencies
npm run chatbot:install
```

### 2. Environment Setup

Create a `.env` file in the `chatbot-backend` directory:

```env
OPENAI_API_KEY=your_openai_api_key_here
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Start the Chatbot Backend

```bash
# Development mode
npm run chatbot:dev

# Or use the startup script
cd chatbot-backend
./start.bat  # Windows
./start.sh   # Linux/Mac
```

### 4. Start the Frontend

```bash
# In a separate terminal
npm run dev
```

## 🏗️ Architecture

### Backend Structure

```
chatbot-backend/
├── src/
│   ├── controllers/     # Request handlers
│   ├── services/        # Business logic (OpenAI, Conversation)
│   ├── routes/          # API routes
│   ├── middleware/      # Express middleware
│   ├── types/           # TypeScript types
│   └── index.ts         # Application entry point
├── package.json
├── tsconfig.json
└── README.md
```

### Frontend Integration

```
src/
├── components/
│   └── Chatbot.tsx      # Main chatbot component
├── lib/
│   └── chatbotApi.ts    # API service layer
└── components/
    ├── Dashboard.tsx           # Integrated chatbot
    ├── ComplianceDashboard.tsx # Integrated chatbot
    ├── BillingDashboard.tsx    # Integrated chatbot
    └── DoctorRosterDashboard.tsx # Integrated chatbot
```

## 🤖 Features

### AI-Powered Responses

- **OpenAI GPT-4 Integration**: Intelligent, context-aware responses
- **Dashboard Context**: Understands current dashboard and data type
- **Industry-Specific**: Tailored responses for healthcare, billing, compliance
- **Real-time Processing**: Fast response times with token usage tracking

### User Experience

- **Floating Widget**: Non-intrusive chat button in bottom-right corner
- **Minimizable**: Can be minimized to save screen space
- **Conversation History**: Persistent chat history during session
- **Error Handling**: Graceful error handling with user-friendly messages
- **Loading States**: Visual feedback during AI processing

### Security & Performance

- **Rate Limiting**: Prevents abuse with configurable limits
- **Input Validation**: Sanitizes and validates all user input
- **CORS Protection**: Secure cross-origin requests
- **Error Logging**: Comprehensive error tracking and logging

## 📡 API Endpoints

### Chat Endpoints

- `POST /api/chat/message` - Send message to chatbot
- `GET /api/chat/conversation/:id` - Get conversation history
- `GET /api/chat/conversations` - List all conversations
- `DELETE /api/chat/conversation/:id` - Delete conversation
- `GET /api/chat/health` - Health check

### Request Example

```json
POST /api/chat/message
{
  "message": "What insights can you provide about my billing data?",
  "conversationId": "conv_1234567890_abc123",
  "context": {
    "industry": "healthcare",
    "dataType": "billing",
    "currentDashboard": "billing"
  }
}
```

### Response Example

```json
{
  "message": "Based on your billing data, I can see several key insights...",
  "conversationId": "conv_1234567890_abc123",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "metadata": {
    "tokens": 150,
    "model": "gpt-4",
    "processingTime": 1200
  }
}
```

## 🎯 Context Awareness

The chatbot is context-aware and provides different responses based on:

### Dashboard Context

- **Business Intelligence**: General data analysis and insights
- **Compliance**: Healthcare compliance and regulatory guidance
- **Billing**: Revenue analysis and billing insights
- **Doctor Roster**: Staff management and scheduling insights

### Industry Context

- **Healthcare**: Medical terminology and healthcare-specific insights
- **General**: Business intelligence and data analysis

### Data Type Context

- **Billing Data**: Revenue, payments, financial metrics
- **Compliance Data**: Regulatory compliance, violations, audits
- **Doctor Roster**: Staff information, schedules, credentials
- **General Data**: Generic business data analysis

## 🔧 Configuration

### Environment Variables

| Variable                  | Description               | Default               |
| ------------------------- | ------------------------- | --------------------- |
| `OPENAI_API_KEY`          | OpenAI API key (required) | -                     |
| `PORT`                    | Server port               | 5000                  |
| `NODE_ENV`                | Environment               | development           |
| `FRONTEND_URL`            | Frontend URL for CORS     | http://localhost:5173 |
| `RATE_LIMIT_WINDOW_MS`    | Rate limit window         | 900000 (15 min)       |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window   | 100                   |

### Frontend Configuration

The chatbot can be configured via props:

```tsx
<Chatbot
  context={{
    industry: "healthcare",
    dataType: "billing",
    currentDashboard: "billing",
  }}
  className="custom-chatbot-styles"
/>
```

## 🚀 Deployment

### Development

```bash
# Start chatbot backend
npm run chatbot:dev

# Start frontend (in separate terminal)
npm run dev
```

### Production

```bash
# Build chatbot backend
npm run chatbot:build

# Start production chatbot
npm run chatbot:start

# Build frontend
npm run build
```

### Docker (Optional)

```dockerfile
# Chatbot Backend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY chatbot-backend/package*.json ./
RUN npm ci --only=production
COPY chatbot-backend/dist ./dist
EXPOSE 5000
CMD ["npm", "start"]
```

## 🧪 Testing

### Health Check

```bash
curl http://localhost:5000/health
```

### Send Test Message

```bash
curl -X POST http://localhost:5000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, how can you help me?"}'
```

### Frontend Testing

1. Open the dashboard
2. Click the chat button in bottom-right corner
3. Send a test message
4. Verify AI response

## 🐛 Troubleshooting

### Common Issues

1. **Chatbot not responding**

   - Check if backend is running on port 5000
   - Verify OpenAI API key is set
   - Check browser console for errors

2. **CORS errors**

   - Ensure FRONTEND_URL is set correctly
   - Check if frontend is running on expected port

3. **Rate limiting**

   - Check rate limit configuration
   - Wait for rate limit window to reset

4. **OpenAI API errors**
   - Verify API key is valid
   - Check API quota and billing
   - Review error logs for specific issues

### Debug Mode

Set `NODE_ENV=development` for detailed error messages and logging.

## 📊 Monitoring

### Health Endpoints

- `/health` - General health check
- `/api/chat/health` - Chatbot-specific health check

### Logging

- Structured logging with Morgan
- Error tracking and reporting
- Performance metrics (response times, token usage)

## 🔒 Security Considerations

- **API Key Protection**: Never expose OpenAI API key in frontend
- **Rate Limiting**: Prevents abuse and excessive API usage
- **Input Validation**: Sanitizes all user input
- **CORS Configuration**: Restricts cross-origin requests
- **Error Handling**: Prevents information leakage

## 📈 Performance Optimization

- **Conversation Memory**: Limits conversation history to prevent token overflow
- **Response Caching**: Caches frequent responses (future enhancement)
- **Connection Pooling**: Efficient database connections (future enhancement)
- **Load Balancing**: Multiple backend instances (future enhancement)

## 🎨 Customization

### UI Customization

The chatbot component accepts a `className` prop for custom styling:

```tsx
<Chatbot className="custom-chatbot" context={context} />
```

### System Message Customization

Modify the system message in `openaiService.ts` to change the AI's behavior and personality.

### Response Formatting

Customize response formatting in the `Chatbot.tsx` component's `renderMessage` function.

## 📝 License

This chatbot integration is part of the CSV Sensei Dashboard project and follows the same license terms.

## 🤝 Contributing

1. Follow the existing code style and patterns
2. Add tests for new features
3. Update documentation for API changes
4. Ensure backward compatibility

## 📞 Support

For issues and questions:

1. Check the troubleshooting section
2. Review error logs
3. Check OpenAI API status
4. Contact the development team
