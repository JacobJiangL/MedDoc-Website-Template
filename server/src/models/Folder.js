const mongoose = require("mongoose");

const ObjectId = mongoose.Schema.Types.ObjectId;

const folderSchema = new mongoose.Schema({
  name: {type: String, required: true},
  parentFolder: {type: ObjectId, ref: "Folder"},
  documents: {
    type: [ {type: ObjectId, ref: "Document"} ],
    default: [],
  },
  subfolders: {
    type: [ {type: ObjectId, ref: "Folder"} ],
    default: [],
  },
});

module.exports = mongoose.model("Folder", folderSchema);