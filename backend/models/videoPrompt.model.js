const mongoose = require("mongoose");

const videoPromptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User"
  },
  content: {
    type: String,
    required: true,
  },
  story: {
    type: String,
    required: true,
  },
  characters: {
    type: [
      {
        name: { type: String, required: true },
        age: { type: String, required: true },
        description: { type: String, required: true },
      }
    ],
    required: true,
  },
});

module.exports = mongoose.model("VideoPrompt", videoPromptSchema);
