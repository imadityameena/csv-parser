# CSV Sensei Chatbot Backend

AI-powered chatbot backend for the CSV Sensei Dashboard, providing intelligent assistance for data analysis and business intelligence.

## Features

- 🤖 **OpenAI Integration**: Powered by GPT-4 for intelligent responses
- 💬 **Conversation Management**: Persistent conversation history
- 🔒 **Security**: Rate limiting, input validation, and error handling
- 📊 **Context Awareness**: Understands dashboard context and data types
- 🚀 **High Performance**: Optimized for production use

## Quick Start

### Prerequisites

- Node.js 18+
- OpenAI API Key
- npm or yarn

### Installation

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Environment Setup:**
   Create a `.env` file in the root directory:

   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

3. **Development:**

   ```bash
   npm run dev
   ```

4. **Production:**
   ```bash
   npm run build
   npm start
   ```

## API Endpoints

### Chat Endpoints

- `POST /api/chat/message` - Send a message to the chatbot
- `GET /api/chat/conversation/:id` - Get conversation history
- `GET /api/chat/conversations` - List all conversations
- `DELETE /api/chat/conversation/:id` - Delete a conversation
- `GET /api/chat/health` - Health check

### Request/Response Examples

**Send Message:**

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

**Response:**

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

## Architecture

```
src/
├── controllers/     # Request handlers
├── services/        # Business logic
├── routes/          # API routes
├── middleware/      # Express middleware
├── types/           # TypeScript types
└── index.ts         # Application entry point
```

## Configuration

### Environment Variables

| Variable                  | Description               | Default               |
| ------------------------- | ------------------------- | --------------------- |
| `OPENAI_API_KEY`          | OpenAI API key (required) | -                     |
| `PORT`                    | Server port               | 5000                  |
| `NODE_ENV`                | Environment               | development           |
| `FRONTEND_URL`            | Frontend URL for CORS     | http://localhost:5173 |
| `RATE_LIMIT_WINDOW_MS`    | Rate limit window         | 900000 (15 min)       |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window   | 100                   |

### Rate Limiting

- 100 requests per 15 minutes per IP
- Configurable via environment variables
- Returns 429 status when exceeded

## Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Prevents abuse
- **Input Validation**: Sanitizes user input
- **Error Handling**: Secure error responses

## Error Handling

The API returns structured error responses:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

Common error codes:

- `INVALID_MESSAGE` - Invalid message format
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `CHAT_ERROR` - OpenAI API error
- `CONVERSATION_NOT_FOUND` - Conversation doesn't exist

## Development

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server

### Testing

```bash
# Health check
curl http://localhost:5000/health

# Send test message
curl -X POST http://localhost:5000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, how can you help me?"}'
```

## Deployment

### Docker (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 5000
CMD ["npm", "start"]
```

### Environment Setup

1. Set production environment variables
2. Use process manager (PM2, systemd)
3. Configure reverse proxy (nginx)
4. Set up monitoring and logging

## Monitoring

- Health check endpoint: `/health`
- Chat health check: `/api/chat/health`
- Structured logging with Morgan
- Error tracking and reporting

## License

MIT License - see LICENSE file for details.
