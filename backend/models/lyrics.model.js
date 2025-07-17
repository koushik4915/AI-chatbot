const mongoose = require("mongoose");

const LyricsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  concept: String,
  genre: String,
  verses: Number,
  mood: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Lyrics", LyricsSchema);
