const mongoose = require("mongoose");

const Folder = require("../models/Folder");
const Document = require("../models/Document");

const folderService = require("./folderService");
const fileService = require("./fileService");

const { ValidationError, ResourceExistsError, NotFoundError } = require("../errors/errors");

const { withTransaction } = require("../db/utils/transactionHandler");


/**
 * Creates a document and updates its parent folder
 * @param {mongoose.Types.ObjectId} parentId 
 * @param {String} name 
 * @param {String} extension 
 * @param {String} description 
 * @returns new document on successful creation
 */
const createAndAddDocumentToFolder = withTransaction(async (session, parentId, name, extension, description, tempFileName) => {

  const parentFolder = await Folder.findById(parentId).session(session);

  // document already exists
  if (await Document.findOne({ name: name, extension: extension, parentFolder: parentFolder })) {
    throw new ResourceExistsError();
  }

  // generate document data and save
  try {
    const newDocument = new Document({
      name,
      extension,
      format: "file",
      parentFolder: parentFolder._id,
      description,
    });
    await newDocument.save({ session });
  
    // add to parent folder
    await folderService.addFolderContents(parentFolder, newDocument, -1, session);

    // properly save to server storage
    const { path } = await getNameAndPath(newDocument);

    try {
      await fileService.moveDocumentAfterCreation(tempFileName, path);
      await fileService.clearTemp();
    } catch (err) {
      await fileService.clearTemp();
      throw err;
    }

    return newDocument;
  } catch (err) {
    throw new ValidationError(`Error generating document data: ${err}`);
  }
});

/**
 * Renames a document
 * @param {mongoose.Types.ObjectId} documentId 
 * @param {String} newName 
 * @returns renamed document on success
 */
const renameDocument = withTransaction(async (session, documentId, newName) => {

  const selectedDocument = await Document.findById(documentId).session(session);

  // don't need to do anything if rename is same as current name
  if (selectedDocument.name === newName) {
    return selectedDocument;
  }

  // document already exists
  if (await Document.findOne({ name: newName, parentFolder: selectedDocument.parentFolder }).session(session)) {
    throw new ResourceExistsError(`Document named '${newName}' already exists here.`);
  }
  const { path } = await getNameAndPath(selectedDocument);
  
  selectedDocument.name = newName;
  await selectedDocument.save({ session });
  
  if (!selectedDocument) {
    throw new Error("Error renaming folder");
  }
  
  await fileService.renameFile(path, newName);

  return selectedDocument;
});

/**
 * Moves a document from one folder to another
 * @param {mongoose.Types.ObjectId} documentId 
 * @param {mongoose.Types.ObjectId} moveTo 
 * @param {mongoose.Types.ObjectId} placeAfter
 * @returns moved document on success 
 */
const moveDocument = withTransaction(async (session, documentId, moveTo, placeAfter) => {
  // get relevant folders & document
  const selectedDocument = await Document.findById(documentId).populate("parentFolder").session(session);
  const currentParent = selectedDocument.parentFolder;
  let newParent = currentParent;

  const currentPath = (await getNameAndPath(selectedDocument)).path;

  if (!currentParent._id.equals(moveTo)) {
    newParent = await Folder.findById(moveTo).session(session);
  }

  const currentIndex = currentParent.documents.indexOf(selectedDocument._id);
  let newIndex = 0;
  if (placeAfter) {
    if (currentParent._id.equals(moveTo) && currentIndex < newIndex) {
      newIndex = newParent.documents.indexOf(placeAfter);
    } else {
      newIndex = newParent.documents.indexOf(placeAfter) + 1;
    }
  }

  // if current location is the destination, do nothing
  if (currentParent._id.equals(moveTo) && currentIndex === newIndex) {
    return selectedDocument;
  }

  if (selectedDocument.populated("parentFolder")) {
    selectedDocument.depopulate("parentFolder");
  }

  // document already exists
  if (!currentParent._id.equals(moveTo) && await Document.findOne({ name: selectedDocument.name, parentFolder: newParent._id })) {
    throw new ResourceExistsError(`Document named '${selectedDocument.name}' already exists in ${newParent.name}.`);
  }

  // set new parent for selected
  selectedDocument.parentFolder = newParent._id;
  await selectedDocument.save({ session });

  // update folder contents to add to new parent and remove from old
  await folderService.removeFolderContents(currentParent, selectedDocument, session);
  await folderService.addFolderContents(newParent, selectedDocument, newIndex, session);

  if (!currentParent._id.equals(moveTo)) {
    const newPath = (await getNameAndPath(selectedDocument)).path;
    await fileService.moveFile(currentPath, newPath);
  }
  // return when done
  return selectedDocument;
});

/**
 * Updates the description of a document
 * @param {mongoose.Types.ObjectId} documentId 
 * @param {Stirng} newDescription 
 * @returns document with updated description on success
 */
const updateDocumentDescription = async (documentId, newDescription) => {

  const selectedDocument = await Document.findById(documentId);

  if (selectedDocument.description === newDescription) {
    return selectedDocument;
  }

  selectedDocument.description = newDescription;
  await selectedDocument.save();

  return selectedDocument;
}

/**
 * Deletes a document and updates its parent folder
 * @param {mongoose.Types.ObjectId} documentId 
 * @returns deleted document on success
 */
const deleteDocument = withTransaction(async (session, documentId) => {

  const deletedDocument = await Document.findByIdAndDelete(documentId, { session });
  const parentFolder = await Folder.findById(deletedDocument.parentFolder).session(session);

  await folderService.removeFolderContents(parentFolder, deletedDocument, session);

  const { path } = await getNameAndPath(deletedDocument);

  await fileService.deleteFile(path);

  return deletedDocument;
});

/**
 * Provides the data of a document
 * @param {mongoose.Types.ObjectId} documentId 
 * @returns the requested document on success
 */
const getDocument = async (documentId) => {
  const selectedDocument = await Document.findById(documentId);
  if (!selectedDocument) {
    throw new NotFoundError("Document not found");
  }
  const { path } = await getNameAndPath(selectedDocument);

  const file = await fileService.getFile(path);

  return {
    document: selectedDocument,
    path: path,
    file: file,
  };
}

/**
 * Provides all documents
 * @returns a { documents } object
 */
const getAllDocuments = async () => {
  const documents = await Document.find({}).populate({ path: "parentFolder", select: "_id name"});

  return { documents };
}

const getNameAndPath = async (document) => {
  return {
    fullName: document.name + "." + document.extension, 
    path: await folderService.constructFilePath(document),
  };
}

module.exports = {
  createAndAddDocumentToFolder,
  renameDocument,
  moveDocument,
  updateDocumentDescription,
  deleteDocument,
  getDocument,
  getAllDocuments,
}