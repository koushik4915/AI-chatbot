const Chat = require("../models/chat.model");
const File = require("../models/file.model");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { generateEmbedding, findRelevantChunks, generateSummary } = require("../utils/embedding-utils");
require("dotenv").config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

let io; 


exports.setupSocketIo = (socketIo) => {
  io = socketIo;
};

exports.sendMessage = async (req, res) => {
  const { message } = req.body;
  const { fileIds } = req.body;
  const chatId = req.params.id;
  const userId = req.user._id.toString();

  try {
    const chat = await Chat.findOne({ _id: chatId, userId: req.user._id });
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    let fileReferences = [];
    if (fileIds && fileIds.length > 0) {
      const files = await File.find({
        _id: { $in: fileIds },
        userId: req.user._id
      }).select("_id fileName");
      
      fileReferences = files.map(file => ({
        fileId: file._id,
        fileName: file.fileName
      }));
    }

    let messageEmbedding = [];
    try {
      messageEmbedding = await generateEmbedding(message);
    } catch (err) {
      console.warn("Embedding generation failed, continuing without embedding:", err.message);
    }
    

    chat.messages.push({ 
      sender: "user", 
      content: message,
      embedding: messageEmbedding.length ? messageEmbedding : undefined,
      fileRefs: fileReferences
    });
    

    const isFirstMessage = chat.messages.length === 1;
    

    if (isFirstMessage) {
      chat.title = message.substring(0, 50);
    }
    
    await chat.save();


    if (io) {
      io.to(userId).emit('processing', { chatId, status: 'started' });
    }



    if (chat.messages.length > 10 && chat.messages.length % 10 === 0) {

      const messagesForSummary = chat.messages.slice(-11, -1); 
      

      const summary = await generateSummary(messagesForSummary);
      

      chat.summaries.push({
        text: summary.text,
        embedding: summary.embedding,
        messageRange: {
          start: chat.messages.length - 11,
          end: chat.messages.length - 1
        }
      });
      
      await chat.save();
    }


    let fileContext = "";
    if (fileReferences.length > 0) {

      const referencedFiles = await File.find({
        _id: { $in: fileReferences.map(ref => ref.fileId) }
      });
      

      const allChunks = referencedFiles.flatMap(file => 
        file.chunks.map(chunk => ({
          text: chunk.text,
          embedding: chunk.embedding,
          fileName: file.fileName
        }))
      );
      

      if (allChunks.length > 0) {
        const relevantFileChunks = await findRelevantChunks(message, allChunks, 3);
        

        fileContext = relevantFileChunks.map(chunk => 
          `[From ${chunk.fileName}]: ${chunk.text}`
        ).join('\n\n');
      }
    }

    const relevantMessageContext = await getRelevantMessages(chat, message);

    const history = [];
    
    const recentMessages = chat.messages.slice(-6, -1); 
    for (const msg of recentMessages) {
      history.push({
        role: msg.sender === "user" ? "user" : "model",
        parts: [{ text: msg.content }]
      });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    });

    const chatSession = model.startChat({
      history,
      generationConfig: {
        maxOutputTokens: 8192,
      },
    });

    let contextPrompt = "";
    
    if (fileContext || relevantMessageContext) {
      contextPrompt = `[System] Prioritize (70%) this context over general knowledge:\n\n`;
      
      if (fileContext) {
        contextPrompt += `FILE CONTEXT:\n${fileContext}\n\n`;
      }
      
      if (relevantMessageContext) {
        contextPrompt += `CONVERSATION CONTEXT:\n${relevantMessageContext}\n\n`;
      }
      
      contextPrompt += `Now answer the user's query based on this context and your knowledge.\n\n`;
    }

    const promptWithContext = contextPrompt + message;

    const result = await chatSession.sendMessageStream(promptWithContext);
    
    let aiReply = "";

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        aiReply += chunkText;
        if (io) {
          io.to(userId).emit('message-chunk', { 
            chatId, 
            chunk: chunkText 
          });
        }
      }
    }

    const aiReplyEmbedding = await generateEmbedding(aiReply);

    chat.messages.push({ 
      sender: "ai", 
      content: aiReply,
      embedding: aiReplyEmbedding
    });
    
    if (isFirstMessage) {
      const titlePrompt = `Based on this conversation, generate a very brief title (max 5 words):\nUser: ${message}\nAI: ${aiReply}`;
      try {
        const titleResponse = await model.generateContent(titlePrompt);
        const suggestedTitle = titleResponse.response.text().trim();
        chat.title = suggestedTitle.length > 50 
          ? suggestedTitle.substring(0, 47) + "..." 
          : suggestedTitle;
      } catch (titleErr) {
        console.error("Error generating title:", titleErr);
        chat.title = message.length > 30 
          ? message.substring(0, 27) + "..." 
          : message;
      }
    }
    
    await chat.save();

    if (io) {
      io.to(userId).emit('processing', { 
        chatId, 
        status: 'completed', 
        title: chat.title 
      });
    }

    res.json({ 
      success: true, 
      message: "Message sent and processed",
      response: aiReply,
      title: chat.title
    });
  } catch (err) {
    console.error("Gemini API error:", err);
    
    if (io) {
      io.to(userId).emit('error', { 
        chatId, 
        error: err.message 
      });
    }
    
    const errorMessage = err.response?.data?.error?.message || err.message;
    res.status(500).json({ message: "Gemini API failed", error: errorMessage });
  }
};

async function getRelevantMessages(chat, query) {
  try {

    if (chat.messages.length <= 5) {
      return "";
    }
    

    const messagesWithEmbeddings = chat.messages
      .slice(0, -5)
      .filter(msg => msg.embedding && msg.embedding.length > 0);
    

    if (messagesWithEmbeddings.length === 0) {
      const recentContextMessages = chat.messages
        .slice(Math.max(0, chat.messages.length - 10), -5)
        .map(msg => `${msg.sender.toUpperCase()}: ${msg.content}`)
        .join('\n\n');
      return recentContextMessages;
    }
    

    const relevantMessages = await findRelevantChunks(
      query, 
      messagesWithEmbeddings.map(msg => ({
        text: msg.content,
        embedding: msg.embedding
      })),
      3
    );
    
    return relevantMessages
      .map(msg => `${msg.text}`)
      .join('\n\n');
  } catch (error) {
    console.error('Error getting relevant messages:', error);
    return "";
  }
}
async function getRelevantSummaries(chat, query) {
  try {
    if (!chat.summaries || chat.summaries.length === 0) {
      return "";
    }
    
    const relevantSummaries = await findRelevantChunks(
      query,
      chat.summaries.map(summary => ({
        text: summary.text,
        embedding: summary.embedding
      })),
      1 
    );
    

    return relevantSummaries
      .map(summary => `CONVERSATION SUMMARY: ${summary.text}`)
      .join('\n\n');
  } catch (error) {
    console.error('Error getting relevant summaries:', error);
    return ""; 
  }
}


exports.sendImageMessage = async (req, res) => {
  const { message } = req.body;
  const chatId = req.params.id;
  const userId = req.user._id.toString();
  
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }
    
    const chat = await Chat.findOne({ _id: chatId, userId: req.user._id });
    if (!chat) return res.status(404).json({ message: "Chat not found" });
    
    const fs = require('fs');
    const imageData = fs.readFileSync(req.file.path);
    const base64Image = imageData.toString('base64');
    
    if (io) {
      io.to(userId).emit('processing', { chatId, status: 'started' });
    }

    chat.messages.push({ 
      sender: "user", 
      content: message || "Image query",
      fileRefs: [{
        fileName: req.file.originalname
      }]
    });
    await chat.save();
    
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    });
    
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: req.file.mimetype
      }
    };
    
    const textPart = {
      text: message || "What's in this image?"
    };
    
    const result = await model.generateContentStream([textPart, imagePart]);
    
    let aiReply = "";
    
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        aiReply += chunkText;
        if (io) {
          io.to(userId).emit('message-chunk', { 
            chatId, 
            chunk: chunkText 
          });
        }
      }
    }
    
    chat.messages.push({ 
      sender: "ai", 
      content: aiReply
    });
    
    if (chat.messages.length <= 2) {
      const titlePrompt = `Based on this image analysis, generate a very brief title (max 5 words):
      Image description: ${message || "Image query"}
      AI analysis: ${aiReply.substring(0, 200)}`;
      
      try {
        const titleResponse = await genAI.getGenerativeModel({
          model: "gemini-1.5-flash",
        }).generateContent(titlePrompt);
        
        const suggestedTitle = titleResponse.response.text().trim();
        chat.title = suggestedTitle.length > 50 
          ? suggestedTitle.substring(0, 47) + "..." 
          : suggestedTitle;
      } catch (titleErr) {
        console.error("Error generating title:", titleErr);
        chat.title = "Image Analysis";
      }
    }
    
    await chat.save();
    
    try {
      fs.unlinkSync(req.file.path);
    } catch (cleanupErr) {
      console.error("Error cleaning up file:", cleanupErr);
    }

    if (io) {
      io.to(userId).emit('processing', { 
        chatId, 
        status: 'completed', 
        title: chat.title 
      });
    }

    res.json({ 
      success: true, 
      message: "Image processed",
      response: aiReply,
      title: chat.title
    });
    
  } catch (err) {
    console.error("Gemini Vision API error:", err);
    
    if (io) {
      io.to(userId).emit('error', { 
        chatId, 
        error: err.message 
      });
    }
    
    if (req.file) {
      try {
        const fs = require('fs');
        fs.unlinkSync(req.file.path);
      } catch (cleanupErr) {
        console.error("Error cleaning up file:", cleanupErr);
      }
    }
    
    const errorMessage = err.response?.data?.error?.message || err.message;
    res.status(500).json({ message: "Gemini Vision API failed", error: errorMessage });
  }
};