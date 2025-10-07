import 'dotenv/config';
import { aiService } from '../services/aiService.js';

async function trainAIAgent() {
  console.log('🚀 Starting AI Agent Training...');
  
  try {
    // Initialize the AI service
    console.log('📚 Initializing knowledge base...');
    await aiService.initializeVectorStore();
    console.log(`✅ Knowledge base initialized with ${aiService.getKnowledgeBaseSize()} questions`);
    
    // Train the agent with multiple epochs
    console.log('🧠 Training AI agent...');
    await aiService.trainAgent(5); // 5 epochs
    
    console.log('🎉 AI Agent training completed successfully!');
    console.log(`📊 Knowledge base contains ${aiService.getKnowledgeBaseSize()} questions`);
    console.log('🔍 Supported questions:');
    
    const questions = aiService.getSupportedQuestions();
    questions.slice(0, 10).forEach((question, index) => {
      console.log(`   ${index + 1}. ${question}`);
    });
    
    if (questions.length > 10) {
      console.log(`   ... and ${questions.length - 10} more questions`);
    }
    
    console.log('\n✨ AI Agent is ready to answer questions about the CSV Sensei Dashboard!');
    
  } catch (error) {
    console.error('❌ Error training AI agent:', error);
    process.exit(1);
  }
}

// Run the training if this script is executed directly
if (require.main === module) {
  trainAIAgent();
}

export { trainAIAgent };
