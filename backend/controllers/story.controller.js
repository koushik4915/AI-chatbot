const Story = require("../models/story.model");
const Chat = require("../models/chat.model");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { generateEmbedding } = require("../utils/embedding-utils");
const { loadBannedWords } = require("../utils/bannedWords");
const path = require("path");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
let io;

exports.setupSocketIo = (socketIo) => {
  io = socketIo;
};

const bannedWords = loadBannedWords(path.join(__dirname, "../data/banned-words.xlsx"));


exports.generateStory = async (req, res) => {
  const {
    theme,
    storyFormat,
    storyStyle,
    wordCount,
    sceneCount,
    ageGroup,
    moral,
    storyType,
    chatId,
  } = req.body;
  const userId = req.user._id;

  try {
    if (!theme || !sceneCount || !ageGroup) {
      return res.status(400).json({ message: "Missing required parameters" });
    }

    if (io) {
      io.emit("processing", {
        type: "story",
        status: "started",
      });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    });

    const prompt = `
    one major thing to consider is don't use any words from this set of words ${bannedWords}
You are a master storyteller generating a complete, high-quality story output ONLY—no explanations, no summaries, no introductions—just the story itself.

FORMAT RULES:
- **STORY FORMAT**: ${storyFormat} // Options: "Book-Style Narrative", "Animation/Dialogue-Driven"
- **TARGET AGE GROUP**: ${ageGroup}
- **WORD COUNT**: Around ${wordCount} words
- **THEME**: ${theme}
- **SCENE COUNT (optional)**: ${sceneCount}
- **STORY STYLE**: ${storyStyle} // Options: "Conversational", "Descriptive", or "Mixed"
- **GENRE (optional)**: ${storyType}
- **MORAL (optional)**: ${moral}

OUTPUT STRUCTURE RULES:
1. Start with the **Title** in bold and centered.
2. Clearly break down the story into bold **Scene** headings (e.g., **Scene 1: The Awakening**).
3. After each scene heading, leave one empty line, then begin the story portion for that scene.
4. If storyStyle is "Descriptive", focus on immersive narration, world-building, character thoughts, emotions, and action.
5. If storyStyle is "Conversational", ensure **at least 70%** of the story is **formatted in dialogue**, using:
   **Character Name**: "Dialogue here"
   Include character actions, tone, and reactions through brief interjections in between dialogues.
6. If storyStyle is "Mixed", blend description and dialogue fluidly with cinematic transitions.
7. Avoid repetitive phrases, dialogue, or events. Keep it fresh, engaging, and original.
8. Make the vocabulary rich yet age-appropriate.
9. End with a **positive**, **emotionally satisfying conclusion**. If a moral is provided, reflect it clearly.
10. The entire output should be visually clean, easy to read, and **only contain the story content**—no instructions or headers.

EXAMPLE STRUCTURE TO FOLLOW:

**Title: The Whispering Woods**

**Scene 1: Into the Forest**

[Story content here...]

**Scene 2: The Hidden Door**

[Next story content here...]

(...and so on)

Now generate the story based on the parameters provided.
`;

    const result = await model.generateContentStream(prompt);
    let generatedContent = "";

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        generatedContent += chunkText;

        if (io) {
          io.emit("story-chunk", {
            chunk: chunkText,
          });
        }
      }
    }

    const processedContent = processGeneratedContent(generatedContent, bannedWords);
    const title = extractTitle(processedContent) || `${theme} Story`;

    let storyEmbedding = [];
    try {
      const embeddingText = `${title} ${processedContent.substring(0, 1000)}`;
      storyEmbedding = await generateEmbedding(embeddingText);
    } catch (embeddingError) {
      console.warn("Embedding generation failed:", embeddingError.message);
    }

    const metadata = {
      theme,
      sceneCount,
      ageGroup,
      moral: moral || "",
      storyType: storyType || "adventure",
    };

    const newStory = new Story({
      userId,
      title,
      content: processedContent,
      metadata,
      embedding: storyEmbedding.length ? storyEmbedding : undefined,
      chatId: chatId || undefined,
    });

    await newStory.save();

    if (chatId) {
      const chat = await Chat.findOne({ _id: chatId, userId });

      if (chat) {
        chat.messages.push({
          sender: "user",
          content: `Can you create a kids story about ${theme} with these scene count: ${sceneCount}? For age group: ${ageGroup}`,
        });

        chat.messages.push({
          sender: "ai",
          content: `# ${title}\n\n${processedContent}`,
        });

        await chat.save();
      }
    }

    if (io) {
      io.to(userId.toString()).emit("processing", {
        type: "story",
        status: "completed",
      });
    }

    res.status(201).json({
      success: true,
      story: {
        id: newStory._id,
        title: newStory.title,
        content: newStory.content,
        metadata: newStory.metadata,
        createdAt: newStory.createdAt,
      },
    });
  } catch (error) {

    if (io && userId) {
      io.to(userId.toString()).emit("error", {
        type: "story",
        error: error.message,
      });
    }

    res.status(500).json({
      message: "Failed to generate story",
      error: error.message,
    });
  }
};

function processGeneratedContent(content) {
  if (!content) return "";

  let lines = content.split("\n");
  let uniqueLines = [];
  let seenLines = new Set();

  for (let line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      uniqueLines.push(line);
      continue;
    }

    const dialogueMatch = trimmedLine.match(/^([A-Za-z]+):\s+"(.+)"$/);
    if (dialogueMatch) {
      const character = dialogueMatch[1];
      const dialogue = dialogueMatch[2];

      const key = `${character}:${dialogue}`;
      if (!seenLines.has(key)) {
        seenLines.add(key);
        uniqueLines.push(line);
      }
    } else if (!seenLines.has(trimmedLine)) {
      seenLines.add(trimmedLine);
      uniqueLines.push(line);
    }
  }

  let processed = uniqueLines.join("\n");

  processed = processed.replace(/(\w+)\s+said[,:]?\s+"([^"]+)"/g, '$1: "$2"'); // Fix here

  processed = processed.replace(/^([A-Za-z]+):\s+/gm, "**$1**: ");

  return processed;
}


function extractTitle(content) {
  const titleMatch =
    content.match(/^#\s+(.+)$/m) || content.match(/^([A-Za-z\s]+)$/m);
  if (titleMatch) {
    return titleMatch[1].trim();
  }
  return null;
}
