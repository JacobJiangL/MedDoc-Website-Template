const asyncHandler = require("express-async-handler");

const Folder = require("../models/Folder"); // Adjust the path as needed

const { NotAuthorizedError } = require("../errors/errors");
const convertIdToObject = require("../db/utils/convertIdToObject");

const restrictRootFolder = asyncHandler(async (req, res, next) => {
  const rootFolder = await Folder.findOne({ name: "root", parentFolder: null });
  // check params/body for root identifiers
  // if (req.body || req.body.parentPath === "/") {
  //   throw new NotAuthorizedError("Cannot perform root folder operations");
  // }

  // check param ID against root ID
  if (req.params.folderId === rootFolder.id) {
    throw new NotAuthorizedError("Cannot perform root folder operations");
  }

  next();
});



module.exports = {
  restrictRootFolder,
};