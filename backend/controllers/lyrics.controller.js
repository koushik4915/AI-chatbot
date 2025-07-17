const Lyrics = require("../models/lyrics.model");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
let io;

exports.setupSocketIo = (socketIo) => {
  io = socketIo;
};

exports.generateLyrics = async (req, res) => {
  const { concept, genre, verses, mood } = req.body;
  const userId = req.user._id;

  try {
    if (!concept || !genre || !verses || !mood) {
      return res.status(400).json({ message: "Enter all the fields." });
    }

    io?.to(userId.toString()).emit("processing", {
      type: "lyrics-generator",
      status: "started",
    });

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const songPrompt = `
You are a highly skilled professional songwriter and lyricist. Generate a fully original, emotionally resonant, and stylistically polished song based on the creative inputs below.

Accept both **explicit parameters** (like genre or mood) and **implied references** (e.g., "like Pirates of the Caribbean music" or "vibe similar to Billie Eilish meets Arctic Monkeys"). Interpret all inputs intelligently and creatively.

---
🎵 **USER INPUTS (interpret creatively):**

- **Concept/Theme:** ${concept}  
- **Genre or Style (or reference artists/songs):** ${genre}  
- **Number of Verses (optional):** ${verses}  
- **Mood / Vibe:** ${mood}  
- **Additional Inspiration (optional):** ${referenceTone} // e.g., "mystical like LOTR", "cinematic orchestral", "lofi indie heartbreak"
---

🎶 **SONG STRUCTURE RULES:**
1. Always include a **title** at the top. Make it poetic, symbolic, or fitting for the concept.
2. Generate a complete song including:
   - **Verses**
   - **Chorus (repeatable, catchy)**
   - **Bridge (optional but encouraged if it fits)**
3. Maintain a **consistent rhyming pattern** (ABAB, AABB, etc.) suited to the genre or vibe.
4. Structure and pace the lyrics to suit the **mood and genre**—cinematic, acoustic, pop, hip-hop, etc.
5. If reference music or artists are mentioned, **infuse that vibe** in rhythm, word choice, and imagery. E.g., "Pirates of the Caribbean" = adventurous, bold, sea-tale driven.
6. Avoid unnecessary repetition—**only repeat lines for stylistic effect**.
7. Lyrics should be **original**, emotionally engaging, and **performable** by a real artist or band.
8. If verses aren't specified, generate **2 verses**, **2 choruses**, and a **bridge** by default.

---
🎤 **OUTPUT FORMAT:**

**Title:** <Insert creative song title here>

**Verse 1:**  
<Verse 1 lyrics here>

**Chorus:**  
<Chorus lyrics here>

**Verse 2:**  
<Verse 2 lyrics here>

**Chorus:**  
<Chorus lyrics here>

**Bridge:** *(optional if fits)*  
<Bridge lyrics here>

**Final Chorus (optional tweak or repeat):**  
<Final chorus here>
---

Now, generate the lyrics using the above structure. Be creative, interpretive, and lyrical—no explanation or extra text needed—**only the song output.**
`;


    const result = await model.generateContentStream(songPrompt);
    let lyricText = "";

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        lyricText += chunkText;
        io?.to(userId.toString()).emit("lyric-chunk", {
          chunk: chunkText,
        });
      }
    }

    const titleMatch = lyricText.match(/\*\*Title:\*\*\s*(.*)/i);
    const title = titleMatch ? titleMatch[1].trim() : `${concept} Lyrics`;

    const newLyrics = new Lyrics({
      userId,
      title,
      content: lyricText,
      concept,
      genre,
      verses,
      mood,
    });

    await newLyrics.save();

    io?.to(userId.toString()).emit("processing", {
      type: "lyrics-generator",
      status: "completed",
      lyrics: newLyrics,
    });x

    res.status(201).json({ success: true, lyrics: newLyrics });
  } catch (error) {
    console.error("Lyrics generation error:", error);
    io?.to(userId.toString()).emit("error", {
      type: "lyrics-generator",
      error: error.message,
    });

    res.status(500).json({
      message: "Failed to generate lyrics.",
      error: error.message,
    });
  }
};
