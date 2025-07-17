const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const connectDB = require("./config/db");
const initializeSocket = require("./utils/socket");
const geminiController = require("./controllers/gemini.controller");
const storyController = require("./controllers/story.controller");
const charcterController = require("./controllers/character.controller");
const lyricsController = require("./controllers/lyrics.controller");
const videoPromptController = require("./controllers/video.controller");

dotenv.config();
connectDB();

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true
}));
app.use(express.json());

const server = http.createServer(app);

const io = initializeSocket(server);

geminiController.setupSocketIo(io);
storyController.setupSocketIo(io);
charcterController.setupSocketIo(io);
lyricsController.setupSocketIo(io);
videoPromptController.setupSocketIo(io);


app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/chat", require("./routes/chat.routes"));
app.use("/api/files", require("./routes/file.routes")); 
app.use("/api/stories", require("./routes/story.routes"));
app.use("/api/character", require("./routes/character.routes"));
app.use("/api/lyrics", require("./routes/lyrics.routes"));
app.use("/api/video", require("./routes/videoPrompt.routes"));


app.get("/", (req, res) => res.send("AI Chat Backend Running"));


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server started on http://localhost:${PORT}`));

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});