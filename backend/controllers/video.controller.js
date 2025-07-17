const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();
const VideoPrompt = require("../models/videoPrompt.model");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
let io;

exports.setupSocketIo = (socketIo) => {
  io = socketIo;
};

exports.videoController = async (req, res) => {
  const { story, characters } = req.body;
  const userId = req.user._id;

  try {
    if (!story || !characters) {
      return res.status(400).json({ message: "Enter the given fields." });
    }

    io?.to(userId.toString()).emit("processing", {
      type: "videoPrompt-generator",
      status: "started",
    });

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const videoprompt = `
    You are a professional video scene writer for 3D animated children's content.
    
    Given the following interactive story and character information, your task is to generate a detailed, vivid, and cinematic video prompt. The output will help a 3D animation pipeline visualize and animate the story.
    
    Each scene should contain:
    - **Scene Number and Title**
    - **Description**: Visually describe the key actions and narrative, as if you’re writing for animators. No need to repeat dialogue.
    - **Characters Present**: List of characters in the scene.
    - **Emotions/Expressions**: Dominant emotions on display and facial/body gestures.
    - **Camera**: Shot type (e.g., wide, close-up), angle, or movement.
    - **Environment**: Background design, lighting, time of day, atmosphere, colors.
    
    Now transform the following story into a scene-by-scene video production prompt:
    
    ### STORY:
    ${story}
    
    ### CHARACTERS:
    ${characters}
    
    Begin your output now. Each scene should start with:
    
    **Scene {number}: [Scene Title]**  
    **Description:** ...  
    **Characters Present:** ...  
    **Emotions/Expressions:** ...  
    **Camera:** ...  
    **Environment:** ...
    `;
    
    

    let promptText = "";
    const result = await model.generateContentStream(videoprompt);

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        promptText += chunkText;
        io?.to(userId.toString()).emit("prompt-chunk", {
          chunk: chunkText,
        });
      }
    }

    const newVideoPrompt = new VideoPrompt({
      userId,
      content: promptText,
      story,
      characters,
    });

    await newVideoPrompt.save();

    io?.to(userId.toString()).emit("processing", {
      type: "videoPrompt-generator",
      status: "completed",
    });

    res.status(201).json({
      success: true,
      prompt: newVideoPrompt,
    });
  } catch (error) {
    io?.to(userId.toString()).emit("error", {
      type: "videoPrompt-generator",
      error: error.message,
    });
    res.status(500).json({
      message: "Failed to generate video prompts",
      error: error.message,
    });
  }
};
