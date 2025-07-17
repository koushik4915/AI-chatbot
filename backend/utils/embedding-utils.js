const { GoogleGenerativeAI } = require("@google/generative-ai");
const { withRetry } = require("./retry-utils");
require('dotenv').config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


const embeddingCache = new Map();

exports.generateEmbedding = async (text) => {
  try {
    const cacheKey = text.substring(0, 100); 
    if (embeddingCache.has(cacheKey)) {
      return embeddingCache.get(cacheKey);
    }
    
    const embedding = await withRetry(async () => {
      const model = genAI.getGenerativeModel({ model: "embedding-001" });
      const result = await model.embedContent(text);
      return result.embedding.values;
    }, { maxRetries: 2 });
    
    embeddingCache.set(cacheKey, embedding);
    
    if (embeddingCache.size > 1000) {
      const oldestKey = embeddingCache.keys().next().value;
      embeddingCache.delete(oldestKey);
    }
    
    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    
    if (process.env.NODE_ENV === 'development') {
      console.warn('Returning mock embedding for development');
      return Array(768).fill(0).map(() => Math.random() * 2 - 1); 
    }
    
    throw new Error('Failed to generate embedding');
  }
};

exports.generateChunkEmbeddings = async (chunks) => {
  const embeddedChunks = [];
  
  for (const chunk of chunks) {
    try {
      const embedding = await exports.generateEmbedding(chunk);
      embeddedChunks.push({
        text: chunk,
        embedding
      });
    } catch (error) {
      console.warn('Error embedding chunk, continuing without embedding:', error.message);
      embeddedChunks.push({
        text: chunk,
        embedding: []
      });
    }
  }
  
  return embeddedChunks;
};


exports.cosineSimilarity = (vecA, vecB) => {

  if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) {
    return 0; 
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

exports.findRelevantChunks = async (query, embeddedChunks, count = 3) => {
  try {
    if (!embeddedChunks || embeddedChunks.length === 0) {
      return [];
    }
    
    const queryEmbedding = await exports.generateEmbedding(query);
    

    const scoredChunks = embeddedChunks
      .filter(chunk => chunk.embedding && chunk.embedding.length > 0)
      .map(chunk => {

        const similarity = exports.cosineSimilarity(queryEmbedding, chunk.embedding) * 0.7;
        

        const lengthBonus = Math.min(1, chunk.text.length / 2000) * 0.3;
        
        return {
          ...chunk,
          score: similarity + lengthBonus
        };
      });
    
    if (scoredChunks.length === 0) {
      return [];
    }
    
    return scoredChunks
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
  } catch (error) {
    console.error('Error finding relevant chunks:', error);
    return []; 
  }
};

exports.generateSummary = async (messages) => {
  try {
    const formattedMessages = messages.map(msg => 
      `${msg.sender === 'user' ? 'User' : 'AI'}: ${msg.content}`
    ).join('\n\n');
    
    const prompt = `Summarize the following conversation, focusing on technical details and key decisions. Keep the summary concise but include all important information:

${formattedMessages}`;

    const summary = await withRetry(async () => {
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 4000,
        }
      });
      
      const result = await model.generateContent(prompt);
      return result.response.text();
    });
    
    let embedding = [];
    try {
      embedding = await exports.generateEmbedding(summary);
    } catch (error) {
      console.warn('Error embedding summary, continuing without embedding:', error.message);
    }
    
    return {
      text: summary,
      embedding
    };
  } catch (error) {
    return {
      text: "Previous conversation covered various topics.",
      embedding: []
    };
  }
};