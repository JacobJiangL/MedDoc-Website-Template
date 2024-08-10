const asyncHandler = require("express-async-handler");

const service = require("../services/documentService");
const folderService = require("../services/folderService");
const fileService = require("../services/fileService");

const { MissingFieldsError } = require("../errors/errors");


// @desc    Create document in current directory
// @route   POST /api/documents
// @access  Protected, ADMIN
const createDocument = asyncHandler(async (req, res) => {
  const { parentFolder, name, extension, description="No description" } = req.body;

  const tempFileName = req.tempFileName;

  if (!parentFolder||!name||!extension) {
    throw new MissingFieldsError();
  }

  const newDocument = await service.createAndAddDocumentToFolder(parentFolder, name, extension, description, tempFileName);

  
  if (newDocument) {
    res.status(201).json({
      _id: newDocument.id,
      name: newDocument.name,
      extension: newDocument.extension,
      parentFolder: newDocument.parentFolder,
      description: newDocument.description,
    });
  } else {
    throw new Error("Document creation failed.");
  }
});

// @desc    Rename target document
// @route   PUT /api/documents/:documentId/rename
// @access  Protected, ADMIN
const renameDocument = asyncHandler(async (req, res) => {
  const { documentId } = req.params;
  const { newName } = req.body;

  if (!documentId||!newName) {
    throw new MissingFieldsError();
  }

  const renamedDocument = await service.renameDocument(documentId, newName);
  
  if (renamedDocument) {
    res.status(200).json({
      _id: renamedDocument.id,
      name: renamedDocument.name,
      extension: renamedDocument.extension,
      parentFolder: renamedDocument.parentFolder,
      description: renamedDocument.description,
    });
  } else {
    throw new Error("Document rename failed.");
  }
});

// @desc    Move the target document into a new directory
// @route   PUT /api/documents/:documentId/move
// @access  Protected, ADMIN
const moveDocument = asyncHandler(async (req, res) => {
  const { documentId } = req.params;
  const { moveTo, placeAfter } = req.body;

  if (!documentId||!moveTo) {
    throw new MissingFieldsError();
  }

  const movedDocument = await service.moveDocument(documentId, moveTo, placeAfter);

  if (movedDocument) {
    res.status(200).json({
      _id: movedDocument.id,
      name: movedDocument.name,
      extension: movedDocument.extension,
      parentFolder: movedDocument.parentFolder,
      description: movedDocument.description,
    });
  } else {
    throw new Error("Document move failed.");
  }
});

// @desc    Update the target document's description
// @route   PUT /api/documents/:documentId/description
// @access  Protected, ADMIN
const updateDocumentDescription = asyncHandler(async (req, res) => {
  const { documentId } = req.params;
  const { newDescription } = req.body;

  if (!documentId||!newDescription) {
    throw new MissingFieldsError();
  }

  const updatedDocument = await service.updateDocumentDescription(documentId, newDescription);
  
  if (updatedDocument) {
    res.status(200).json({
      _id: updatedDocument.id,
      name: updatedDocument.name,
      extension: updatedDocument.extension,
      parentFolder: updatedDocument.parentFolder,
      description: updatedDocument.description,
    });
  } else {
    throw new Error("Document description update failed.");
  }
});

// @desc    Delete target document
// @route   DELETE /api/documents/:documentId
// @access  Protected, ADMIN
const deleteDocument = asyncHandler(async (req, res) => {
  const { documentId } = req.params;

  if (!documentId) {
    throw new MissingFieldsError();
  }

  const result = await service.deleteDocument(documentId);

  if (result) {
    res.json({message: "Document succesfully deleted", result});
  } else {
    throw new Error("Document delete failed.");
  }
});

// @desc    Get the details of a document
// @route   GET /api/documents/:documentId
// @access  Protected, USER
const getDocument = asyncHandler(async (req, res) => {
  const { documentId } = req.params;

  if (!documentId) {
    throw new MissingFieldsError();
  }

  const { document, path, file } = await service.getDocument(documentId);

  if (document) {
    res.status(200).json({
      _id: document.id,
      name: document.name,
      extension: document.extension,
      parentFolder: document.parentFolder,
      description: document.description,
      path: path,
      file: file,
    });
  } else {
    throw new Error("Failed to get document.");
  }
});

// @desc    Get all existing documents
// @route   GET /api/documents
// @access  Protected, USER
const getAllDocuments = asyncHandler(async (req, res) => {
  const documents = await service.getAllDocuments();

  res.status(200).json({
    documents,
  });
});

module.exports = {
  createDocument, 
  renameDocument, 
  moveDocument, 
  updateDocumentDescription,
  deleteDocument,
  getDocument,
  getAllDocuments,
}