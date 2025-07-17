

const mongoose = require("mongoose");

const storySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  metadata: {
    theme: String,
    characters: [String],
    ageGroup: String,
    moral: String,
  },
  embedding: {
    type: [Number],
    sparse: true
  },
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chat",
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Story = mongoose.model("Story", storySchema);

module.exports = Story;