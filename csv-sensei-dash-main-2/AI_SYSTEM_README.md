# AI System for CSV Sensei Dashboard

## Overview

The CSV Sensei Dashboard now includes a comprehensive AI-powered assistant that can answer questions about dashboard functionality, features, and usage. The AI system is built using LangChain, OpenAI, and FAISS for vector storage.

## Features

- **50+ Pre-trained Questions**: Comprehensive knowledge base covering all dashboard features
- **Smart Question Filtering**: Only answers questions related to the dashboard
- **Vector-based Search**: Uses FAISS for efficient similarity search
- **Training with Epochs**: Supports multi-epoch training for better responses
- **Real-time Chat Interface**: Interactive chat component in the dashboard
- **Fallback to Local Processing**: Falls back to local answers when AI is unavailable

## Architecture

### Backend Components

1. **AIService** (`Server/src/services/aiService.ts`)

   - Main AI service class
   - Handles vector store initialization
   - Processes questions and generates answers
   - Manages training with epochs

2. **API Endpoints** (`Server/src/routes.ts`)

   - `/api/ai/chat` - Main chat endpoint
   - `/api/ai/initialize` - Initialize AI service
   - `/api/ai/train` - Train AI agent
   - `/api/ai/questions` - Get supported questions
   - `/api/ai/status` - Get AI service status

3. **Training Scripts**
   - `Server/src/scripts/trainAI.ts` - Training script
   - `Server/src/scripts/testAI.ts` - Testing script

### Frontend Components

1. **AIChat** (`src/components/AIChat.tsx`)

   - Interactive chat interface
   - Message history
   - Suggested questions
   - Real-time responses

2. **AIQueryBar** (`src/components/AIQueryBar.tsx`)
   - Updated to use AI service
   - Fallback to local processing
   - Enhanced with AI responses

## Setup Instructions

### 1. Environment Variables

Ensure your `.env` file contains:

```env
OPENAI_API_KEY=your_openai_api_key_here
MONGODB_URI=mongodb://localhost:27017/csv-sensei
PORT=4000
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Initialize AI Service

The AI service automatically initializes when the server starts. You can also manually initialize it:

```bash
npm run ai:train
```

### 4. Test the AI System

```bash
npm run ai:test
```

### 5. Start the Application

```bash
# Start the backend server
npm run server:dev

# In another terminal, start the frontend
npm run dev
```

## Usage

### In the Dashboard

1. Navigate to the dashboard after uploading your CSV
2. Scroll down to see the "AI Dashboard Assistant" section
3. Type your question in the chat input
4. Get instant answers about dashboard features

### Supported Question Types

The AI can answer questions about:

- **General Dashboard**: What is CSV Sensei Dashboard?
- **File Upload**: How do I upload a CSV file?
- **Industries**: What industries are supported?
- **Validation**: How does data validation work?
- **Visualizations**: What visualization types are available?
- **Data Formats**: What data formats are supported?
- **Error Handling**: How do I fix validation errors?
- **Features**: How do I use specific dashboard features?

### Example Questions

- "What is CSV Sensei Dashboard?"
- "How do I upload a CSV file?"
- "What industries are supported?"
- "How does data validation work?"
- "What visualization types are available?"
- "How do I fix validation errors?"
- "What is the maximum file size?"
- "How do I switch between dark and light mode?"

## API Endpoints

### POST /api/ai/chat

Send a question to the AI assistant.

**Request:**

```json
{
  "question": "What is CSV Sensei Dashboard?"
}
```

**Response:**

```json
{
  "answer": "CSV Sensei Dashboard is an AI-powered business intelligence platform...",
  "question": "What is CSV Sensei Dashboard?",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### POST /api/ai/initialize

Initialize the AI service and vector store.

**Response:**

```json
{
  "message": "AI service initialized successfully",
  "knowledgeBaseSize": 50
}
```

### POST /api/ai/train

Train the AI agent with specified epochs.

**Request:**

```json
{
  "epochs": 5
}
```

**Response:**

```json
{
  "message": "AI agent trained successfully with 5 epochs",
  "knowledgeBaseSize": 50
}
```

### GET /api/ai/questions

Get all supported questions.

**Response:**

```json
{
  "questions": ["What is CSV Sensei Dashboard?", "How do I upload a CSV file?", ...],
  "count": 50
}
```

### GET /api/ai/status

Get AI service status.

**Response:**

```json
{
  "initialized": true,
  "knowledgeBaseSize": 50,
  "supportedQuestions": 50
}
```

## Training

The AI system supports training with multiple epochs to improve response quality:

```bash
# Train with 5 epochs (default)
npm run ai:train

# Or train with custom epochs via API
curl -X POST http://localhost:4000/api/ai/train \
  -H "Content-Type: application/json" \
  -d '{"epochs": 10}'
```

## Knowledge Base

The knowledge base contains 50+ questions and answers covering:

1. **Dashboard Overview** (5 questions)
2. **File Upload & Processing** (8 questions)
3. **Data Validation** (10 questions)
4. **Visualizations** (8 questions)
5. **Industry Support** (7 questions)
6. **Error Handling** (6 questions)
7. **Features & Settings** (6 questions)

## Error Handling

The AI system includes comprehensive error handling:

- **API Key Missing**: Graceful fallback to local processing
- **Network Issues**: Error messages with retry suggestions
- **Invalid Questions**: Clear rejection for non-dashboard questions
- **Service Unavailable**: Fallback to local answers

## Security

- All data processing happens locally in the browser
- Only questions are sent to OpenAI API
- No sensitive data is transmitted
- Vector store is stored in memory (not persisted)

## Performance

- **Vector Search**: Sub-second response times
- **Caching**: Vector store cached in memory
- **Fallback**: Local processing when AI unavailable
- **Optimized**: Efficient similarity search with FAISS

## Troubleshooting

### Common Issues

1. **"AI service not initialized"**

   - Check OpenAI API key in `.env`
   - Restart the server
   - Check console logs for errors

2. **"Failed to get AI response"**

   - Check internet connection
   - Verify OpenAI API key is valid
   - Check API rate limits

3. **"I couldn't find information about that"**
   - This is expected for non-dashboard questions
   - Ask questions specifically about the dashboard

### Debug Commands

```bash
# Check AI service status
curl http://localhost:4000/api/ai/status

# Test with a sample question
curl -X POST http://localhost:4000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "What is CSV Sensei Dashboard?"}'

# Get all supported questions
curl http://localhost:4000/api/ai/questions
```

## Future Enhancements

- **Persistent Vector Store**: Save vector store to disk
- **User Feedback**: Learn from user interactions
- **Multi-language Support**: Support for multiple languages
- **Advanced Training**: Fine-tune models on user data
- **Voice Interface**: Add voice input/output
- **Context Awareness**: Remember conversation context

## Contributing

To add new questions to the knowledge base:

1. Edit `DASHBOARD_KNOWLEDGE_BASE` in `aiService.ts`
2. Add your question and answer
3. Test with `npm run ai:test`
4. Retrain with `npm run ai:train`

## License

This AI system is part of the CSV Sensei Dashboard project and follows the same license terms.
