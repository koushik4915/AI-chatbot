const mongoose = require("mongoose");

const characterSchema = new mongoose.Schema({
  storyId: { type: mongoose.Schema.Types.ObjectId, ref: "Story", required: false },
  name: String,
  species: String,
  facialStructure: String,
  hairStyle: String,
  bodyType: String,
  color: String,
  outfit: String,
  accessories: String,
});

module.exports = mongoose.model("Character", characterSchema);