// Simple test script to verify chatbot backend functionality
const fetch = require("node-fetch");

const CHATBOT_URL = "http://localhost:5000";

async function testChatbot() {
  console.log("🧪 Testing CSV Sensei Chatbot Backend...\n");

  try {
    // Test 1: Health Check
    console.log("1. Testing health check...");
    const healthResponse = await fetch(`${CHATBOT_URL}/health`);
    const healthData = await healthResponse.json();
    console.log("✅ Health check passed:", healthData.status);
    console.log("   Services:", healthData.services);
    console.log();

    // Test 2: Chat Health Check
    console.log("2. Testing chat health check...");
    const chatHealthResponse = await fetch(`${CHATBOT_URL}/api/chat/health`);
    const chatHealthData = await chatHealthResponse.json();
    console.log("✅ Chat health check passed:", chatHealthData.status);
    console.log("   OpenAI:", chatHealthData.services.openai);
    console.log();

    // Test 3: Send a test message
    console.log("3. Testing message sending...");
    const messageResponse = await fetch(`${CHATBOT_URL}/api/chat/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Hello! Can you help me understand my data?",
        context: {
          industry: "healthcare",
          dataType: "billing",
          currentDashboard: "billing",
        },
      }),
    });

    if (messageResponse.ok) {
      const messageData = await messageResponse.json();
      console.log("✅ Message sent successfully!");
      console.log(
        "   Response:",
        messageData.message.substring(0, 100) + "..."
      );
      console.log("   Conversation ID:", messageData.conversationId);
      console.log("   Tokens used:", messageData.metadata.tokens);
      console.log(
        "   Processing time:",
        messageData.metadata.processingTime + "ms"
      );
      console.log();

      // Test 4: Get conversation
      console.log("4. Testing conversation retrieval...");
      const conversationResponse = await fetch(
        `${CHATBOT_URL}/api/chat/conversation/${messageData.conversationId}`
      );
      if (conversationResponse.ok) {
        const conversationData = await conversationResponse.json();
        console.log("✅ Conversation retrieved successfully!");
        console.log("   Messages count:", conversationData.messages.length);
        console.log("   Created at:", conversationData.createdAt);
      } else {
        console.log("❌ Failed to retrieve conversation");
      }
    } else {
      const errorData = await messageResponse.json();
      console.log("❌ Message sending failed:", errorData.error);
    }
  } catch (error) {
    console.log("❌ Test failed:", error.message);
    console.log("\n💡 Make sure the chatbot backend is running on port 5000");
    console.log("   Run: npm run chatbot:dev");
  }
}

// Run the test
testChatbot();
