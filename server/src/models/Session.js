const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  sessionId: {
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
  expireAt: {
    type: Date,
    required: true,
    index: { expires: 0 },
  }
});

module.exports = mongoose.model("Session", sessionSchema);