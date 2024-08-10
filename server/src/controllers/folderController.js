const asyncHandler = require("express-async-handler");

const service = require("../services/folderService");

const { MissingFieldsError } = require("../errors/errors");


// @desc    Create a folder in current directory
// @route   POST /api/folders
// @access  Protected, ADMIN
const createFolder = asyncHandler(async (req, res) => {
  let { folderId } = req.params;
  const { name } = req.body;

  // check fields
  if (!name||!folderId) {
    throw new MissingFieldsError();
  }

  const newFolder = await service.createFolder(name, folderId);

  if (newFolder) {
    res.status(201).json({
      _id: newFolder.id,
      name: newFolder.name,
      parentFolder: newFolder.parentFolder,
      documents: newFolder.documents, // []
      subfolders: newFolder.subfolders, // []
    });
  } else {
    throw new Error("Folder creation failed.");
  }
});

// @desc    Rename target folder
// @route   PUT /api/folders/:folderId/rename
// @access  Protected, ADMIN
const renameFolder = asyncHandler(async (req, res) => {
  const { folderId } = req.params;
  const { newName } = req.body;

  if (!folderId||!newName) {
    throw new MissingFieldsError();
  }

  const renamedFolder = await service.renameFolder(folderId, newName);

  if (renamedFolder) {
    res.status(200).json({
      _id: renamedFolder.id,
      name: renamedFolder.name,
      parentFolder: renamedFolder.parentFolder,
      documents: renamedFolder.documents,
      subfolders: renamedFolder.subfolders,
    });
  } else {
    throw new Error("Folder rename failed.");
  }
});

// @desc    Move the target folder into a new directory
// @route   PUT /api/folders/:folderId/move
// @access  Protected, ADMIN
const moveFolder = asyncHandler(async (req, res) => {
  const { folderId } = req.params;
  const { moveTo, placeAfter } = req.body;

  if (!folderId||!moveTo) {
    throw new MissingFieldsError();
  }

  const movedFolder = await service.moveFolder(folderId, moveTo, placeAfter);

  if (movedFolder) {
    res.status(200).json({
      _id: movedFolder.id,
      name: movedFolder.name,
      parentFolder: movedFolder.parentFolder,
      documents: movedFolder.documents,
      subfolders: movedFolder.subfolders,
    });
  } else {
    throw new Error("Folder move failed.");
  }
});

// @desc    Delete target folder
// @route   DELETE /api/folders/:folderId
// @access  Protected, ADMIN
const deleteFolder = asyncHandler(async (req, res) => {
  const { folderId } = req.params;

  if (!folderId) {
    throw new MissingFieldsError();
  }

  const result = await service.deleteFolder(folderId);

  if (result) {
    res.json({message: "Folder succesfully deleted", result});
  } else {
    throw new Error("Folder delete failed.");
  }
});

// @desc    Get the contents of a folder
// @route   GET /api/folders/:folderId
// @access  Protected, USER
const getFolderContents = asyncHandler(async (req, res) => {
  const { folderId } = req.params;

  if (!folderId) {
    throw new MissingFieldsError();
  }

  const contents = await service.getFolderContents(folderId);

  if (contents) {
    res.json({
      documents: contents.documents,
      subfolders: contents.subfolders,
    });
  } else {
    throw new Error("Folder contents not found");
  }
});

// @desc    Get entire folder tree
// @route   GET /api/folders
// @access  Protected, USER
const getAllFolders = asyncHandler(async (req, res) => {
  const tree = await service.getAllFolders();
  if (tree) {
    res.json({
      tree,
    });
  } else {
    throw new Error("Error getting file tree");
  }
});


module.exports = {
  createFolder,
  renameFolder,
  moveFolder,
  deleteFolder,
  getFolderContents,
  getAllFolders,
};