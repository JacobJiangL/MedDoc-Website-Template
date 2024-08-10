const mongoose = require("mongoose");


/* db connection and setup *///

const dbURI = process.env.DB_URI;

mongoose.Promise = global.Promise; // use js promise

const connectMongoDB = async () => {
  try {
    await mongoose.connect(dbURI)
  } catch (err) {
    console.error(err);
  }
}

module.exports = { connectMongoDB };