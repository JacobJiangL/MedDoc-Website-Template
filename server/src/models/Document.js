const mongoose = require("mongoose");

const ObjectId = mongoose.Schema.Types.ObjectId;

const documentSchema = new mongoose.Schema({
  name: {type: String, required: true},
  extension: {type: String, required: true},
  format: {
    type: String,
    enum: ["file", "table"],
    default: "file",
  },
  parentFolder: {type: ObjectId, ref: "Folder", required: true},
  description: {
    type: String,
    required: true,
    default: "",
  },
});

module.exports = mongoose.model("Document", documentSchema);