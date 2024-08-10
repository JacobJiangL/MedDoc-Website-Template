const mongoose = require("mongoose");

const passcodeSchema = new mongoose.Schema({
  passcode: {
    type: String,
    required: true,
    unique: true,
  },
  permission: {
    type: String,
    enum: ["user", "admin"],
    required: true,
    default: "user",
  },
  creationDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  note: {
    type: String,
  },
});

module.exports = mongoose.model("Passcode", passcodeSchema);