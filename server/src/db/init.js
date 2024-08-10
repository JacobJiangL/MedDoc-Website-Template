const mongoose = require("mongoose");
const Folder = require("../models/Folder"); // Adjust path to your Folder model

const fileService = require("../services/fileService");
const { withTransaction } = require("./utils/transactionHandler");

const initializeMongoDB = async () => {
  await createRootFolder();
};

const createRootFolder = withTransaction(async (session) => {
  try {
    let rootFolder = await Folder.findOne({ name: "root", parentFolder: { $exists: false } }).session(session);
    if (!rootFolder) {
      rootFolder = await Folder.create([{ 
        name: "root",
        documents: [],
        subfolders: [],
      }], { session });
      await fileService.createFolder("root");
    } else {
      console.log("Root folder already exists");
    }
  } catch (error) {
    console.error("Error initializing root folder:", error);
  }
});

module.exports = initializeMongoDB;