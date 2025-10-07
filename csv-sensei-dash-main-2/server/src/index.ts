import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { router as api } from './routes';
import { aiService } from './services/aiService.js';

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use('/api', api);

const port = process.env.PORT || 4000;
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('MONGODB_URI not set');
  process.exit(1);
}

mongoose.connect(mongoUri).then(async () => {
  console.log('MongoDB connected');
  
  // Initialize AI service
  try {
    console.log('🤖 Initializing AI service...');
    await aiService.initializeVectorStore();
    console.log(`✅ AI service initialized with ${aiService.getKnowledgeBaseSize()} questions`);
  } catch (error) {
    console.error('❌ Failed to initialize AI service:', error);
    // Don't exit, just log the error - AI features will be disabled
  }
  
  app.listen(port, () => {
    console.log(`🚀 API server running on port ${port}`);
    console.log(`📊 AI Dashboard Assistant ready with ${aiService.getKnowledgeBaseSize()} supported questions`);
  });
}).catch(err => {
  console.error('Mongo connect error', err);
  process.exit(1);
});



