const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.generateChatTitle = async (userMessage, aiResponse) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.2, 
        maxOutputTokens: 30,
      },
    });

    const titlePrompt = `Based on this conversation, generate a very brief, concise title (max 5 words):\nUser: ${userMessage}\nAI: ${aiResponse.substring(0, 200)}`;
    
    const result = await model.generateContent(titlePrompt);
    const title = result.response.text().trim();
    
    return title.length > 50 ? title.substring(0, 47) + "..." : title;
  } catch (error) {
    return userMessage.length > 30 ? userMessage.substring(0, 27) + "..." : userMessage;
  }
};