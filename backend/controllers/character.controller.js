const Character = require("../models/character.model");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
let io;

exports.setupSocketIo = (socketIo) => {
  io = socketIo;
};

exports.generateCharactersFromStory = async (req, res) => {
  const { story } = req.body;
  const userId = req.user._id;

  try {
    if (!story) return res.status(400).json({ message: "Story content is required." });

    if (io) {
      io.to(userId.toString()).emit("processing", {
        type: "3D-Character-Extraction",
        status: "started",
      });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const characterPrompt = `Extract the main and secondary characters from the following kids' story and describe them in a well-formatted way. Use bold section headings and leave a blank line between each detail for clarity.

    Story:
    ${story}
    
    Output format:
    
    **Character Analysis**
    
    **Main Character**
    
    **Name:** <>
      
    **Species:** <>
      
    **Facial Structure:** <>
      
    **Hair Style:** <>
      
    **Body Type and Structure:** <>
      
    **Color:** <>
      
    **Outfit:** <>
      
    **Accessories:** <>
    
    **Other Character**
    
    **Name:** <>
      
    **Species:** <>
      
    **Facial Structure:** <>
      
    **Hair Style:** <>
      
    **Body Type and Structure:** <>
      
    **Color:** <>
      
    **Outfit:** <>
      
    **Accessories:** <>
    `;
    


    const result = await model.generateContentStream(characterPrompt);
    let characterText = "";

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        characterText += chunkText;

        if (io) {
          io.to(userId.toString()).emit("character-chunk", {
            chunk: chunkText,
          });
        }
      }
    }

    const characters = parseCharacterData(characterText);

    const savedCharacters = await Character.insertMany(
      characters.map((char) => ({ ...char, rawStory: story }))
    );

    if (io) {
      io.to(userId.toString()).emit("processing", {
        type: "3D-Character-Extraction",
        status: "completed",
        characters: savedCharacters,
      });
    }

    res.status(201).json({ success: true, characters: savedCharacters });
  } catch (error) {
    console.error("Character generation error:", error);
    if (io) {
      io.to(userId.toString()).emit("error", {
        type: "3D-Character-Extraction",
        error: error.message,
      });
    }
    res.status(500).json({ message: "Failed to extract character data.", error: error.message });
  }
};

function parseCharacterData(text) {
  const blocks = text.split(/\n{2,}/).filter((block) => block.includes("Name:"));

  const characters = blocks.map((block) => {
    const getField = (field) => {
      const match = block.match(new RegExp(`${field}:\\s*(.*)`));
      return match ? match[1].trim() : "";
    };
    return {
      name: getField("Name"),
      species: getField("Species"),
      facialStructure: getField("Facial Structure"),
      hairStyle: getField("Hair Style"),
      bodyType: getField("Body Type and Structure"),
      color: getField("Color"),
      outfit: getField("Outfit"),
      accessories: getField("Accessories"),
    };
  });

  return characters;
}
