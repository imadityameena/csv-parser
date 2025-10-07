import 'dotenv/config';
import { aiService } from '../services/aiService.js';

async function testAIService() {
  console.log('🧪 Testing AI Service...');
  
  try {
    // Initialize the AI service
    console.log('📚 Initializing AI service...');
    await aiService.initializeVectorStore();
    console.log(`✅ AI service initialized with ${aiService.getKnowledgeBaseSize()} questions`);
    
    // Test questions
    const testQuestions = [
      "What is CSV Sensei Dashboard?",
      "How do I upload a CSV file?",
      "What industries are supported?",
      "How does data validation work?",
      "What is the weather today?", // This should be rejected
      "Tell me about machine learning", // This should be rejected
      "What visualization types are available?",
      "How do I fix validation errors?"
    ];
    
    console.log('\n🔍 Testing AI responses...\n');
    
    for (const question of testQuestions) {
      console.log(`❓ Question: ${question}`);
      const answer = await aiService.answerQuestion(question);
      console.log(`🤖 Answer: ${answer}`);
      console.log('---\n');
    }
    
    console.log('✅ AI Service test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing AI service:', error);
    process.exit(1);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testAIService();
}

export { testAIService };
