const mongoose = require("mongoose");

const Folder = require("../models/Folder");
const Document = require("../models/Document");

const fileService = require("./fileService");

const { ValidationError, ResourceExistsError, NotFoundError } = require("../errors/errors");

const { withTransaction } = require("../db/utils/transactionHandler");


/**
 * Creates a new folder and updates its parent folder
 * @param {String} name
 * @param {mongoose.Types.ObjectId} parentId
 * @returns new folder on successful creation
 */
const createFolder = withTransaction(async (session, name, parentId) => {

  const parentFolder = await Folder.findById(parentId).session(session);
  
  // folder already exists
  if (await Folder.findOne({ name: name, parentFolder: parentId })) {
    throw new ResourceExistsError(`Folder named '${name}' already exists here.`);
  }

  // generate folder data and save 
  try {
    const newFolder = new Folder({
      name,
      parentFolder: parentFolder._id,
      documents: [],
      subfolders: [],
    });
    await newFolder.save({ session });

    // update parent folder contents
    await addFolderContents(parentFolder, newFolder, parentFolder.subfolders.length, session);

    const path = await constructFilePath(newFolder);

    await fileService.createFolder(path);

    return newFolder;

  } catch (err) {
    throw new ValidationError(`Error generating folder data: ${err}`);
  }
});


/**
 * Renames a folder
 * @param {mongoose.Types.ObjectId} folderId 
 * @param {String} newName 
 * @returns renamed folder on success
 */
const renameFolder = withTransaction(async (session, folderId, newName) => {

  const selectedFolder = await Folder.findById(folderId).session(session);
  
  // don't need to do anything if rename is same as current name
  if (selectedFolder.name === newName) {
    return selectedFolder;
  }

  // folder already exists
  if (await Folder.findOne({ name: newName, parentFolder: selectedFolder.parentFolder }).session(session)) {
    throw new ResourceExistsError(`Folder named '${newName}' already exists here.`);
  }

  const path = await constructFilePath(selectedFolder);

  selectedFolder.name = newName;
  await selectedFolder.save({ session });
  
  if (!selectedFolder) {
    throw new Error("Error renaming folder");
  }

  await fileService.renameFile(path, newName);

  return selectedFolder;
});


/**
 * Moves a subfolder from one folder to another
 * @param {mongoose.Types.ObjectId} folderId
 * @param {mongoose.Types.ObjectId} moveTo
 * @param {mongoose.Types.ObjectId} placeAfter
 * @returns moved folder on success
 */
const moveFolder = withTransaction(async (session, folderId, moveTo, placeAfter) => {
  // get relevant folders
  const selectedFolder = await Folder.findById(folderId).populate("parentFolder").session(session);
  const currentParent = selectedFolder.parentFolder;
  let newParent = currentParent;

  const currentPath = await constructFilePath(selectedFolder);

  if (!currentParent._id.equals(moveTo)) {
    newParent = await Folder.findById(moveTo).session(session);
  }

  const currentIndex = currentParent.subfolders.indexOf(selectedFolder._id);
  let newIndex = 0;
  if (placeAfter) {
    if (currentParent._id.equals(moveTo) && currentIndex < newIndex) {
      newIndex = newParent.subfolders.indexOf(placeAfter);
    } else {
      newIndex = newParent.subfolders.indexOf(placeAfter) + 1;
    }
  }

  // if current location is the destination, do nothing
  // if destination is inside of current folder, throw error
  if (currentParent._id.equals(moveTo) && currentIndex === newIndex) {
    return selectedFolder;
  }
  if (await isSubfolder(folderId, newParent)) {
    throw new ValidationError("Cannot move folder inside of itself.");
  }

  if (selectedFolder.populated("parentFolder")) {
    selectedFolder.depopulate("parentFolder");
  }

  // folder already exists
  if (!currentParent._id.equals(moveTo) && await Folder.findOne({ name: selectedFolder.name, parentFolder: newParent._id })) {
    throw new ResourceExistsError(`Folder named '${selectedFolder.name}' already exists in ${newParent.name}.`);
  }

  // set new parent for selected
  selectedFolder.parentFolder = newParent._id;
  await selectedFolder.save({ session });

  // update folder contents to add to new parent and remove from old
  await removeFolderContents(currentParent, selectedFolder, session);
  await addFolderContents(newParent, selectedFolder, newIndex, session);

  if (!currentParent._id.equals(moveTo)) {
    const newPath = await constructFilePath(selectedFolder);
    await fileService.moveFile(currentPath, newPath);
  }
  // return when done
  return selectedFolder;
});

/**
 * Deletes a folder and updates its parent folder
 * @param {mongoose.Types.ObjectId} folderId 
 */
const deleteFolder = withTransaction(async (session, folderId) => {
  const selectedFolder = await Folder.findById(folderId).session(session);

  if (selectedFolder.subfolders.length > 0 || selectedFolder.documents.length > 0) {
    throw new ValidationError("Can't delete non-empty folder");
  }

  const parentFolder = await Folder.findById(selectedFolder.parentFolder).session(session);
  const success = await Folder.findByIdAndDelete(selectedFolder._id, { session });

  await removeFolderContents(parentFolder, selectedFolder, session);

  const path = await constructFilePath(selectedFolder);

  await fileService.deleteFile(path);

  return success;
});

/**
 * Provides the documents and subfolders of a folder
 * @param {mongoose.Types.ObjectId} folderId 
 * @returns object containing { documents, subfolders }
 */
const getFolderContents = async (folderId) => {
  const selectedFolder = await Folder.findById(folderId).populate(["subfolders", "documents"]);
  
  if (selectedFolder) {
    return {
      documents: selectedFolder.documents,
      subfolders: selectedFolder.subfolders,
    }
  } else {
    return false;
  }
}

/**
 * Provides the entire file (folder/document) tree
 * @returns file tree on success
 */
const getAllFolders = withTransaction(async (session) => {
  const rootFolder = await Folder.findOne({ name: "root", parentFolder: {$exists: false} }).select("-__v");

  if (rootFolder) {
    const populatedRoot = await populateAllChildren(rootFolder);
    return populatedRoot;
  } else {
    throw new NotFoundError("Root folder missing");
  }
});

const populateAllChildren = async (root) => {
  if (root) {
    await root.populate([
      {path: "documents", select: "_id name"},
      {path: "subfolders", select: "-__v"}, 
    ]);
  }
  if (root.subfolders.length !== 0) {
    for (const subfolder of root.subfolders) {
      await populateAllChildren(subfolder);
    }
  }
  return root;
}

const isSubfolder = async (selectedFolder, targetFolder) => {
  let checkFolder = targetFolder;
  
  while (checkFolder) {
    if (checkFolder._id.equals(selectedFolder)) {
      return true;
    } else {
      await checkFolder.populate("parentFolder");
      checkFolder = checkFolder.parentFolder;
    }
  }
  return false;
}

const addFolderContents = async (folder, file, index, session=null, fetch=false) => {
  // push based on file type
  if (file instanceof Folder) {
    folder.subfolders.splice(index, 0, file._id);
  } else if (file instanceof Document) {
    folder.documents.splice(index, 0, file._id);
  } else {
    throw new Error("Server error adding folder contents");
  }
  // save
  if (session) {
    await folder.save({ session });
  } else {
    await folder.save();
  }
  // return
  if (fetch) {
    if (session) {
      return Folder.findById(folder._id).session(session);
    }
    return Folder.findById(folder._id);
  } else {
    return folder;
  }
}

const removeFolderContents = async (folder, file, session=null, fetch=false) => {
  // remove based on file type
  if (file instanceof Folder) {
    folder.subfolders = folder.subfolders.filter(id => !id.equals(file._id));
  } else if (file instanceof Document) {
    folder.documents = folder.documents.filter(id => !id.equals(file._id));
  } else {
    throw new Error("Server error removing folder contents");
  }
  // save
  if (session) {
    await folder.save({ session });
  } else {
    await folder.save();
  }
  // return
  if (fetch) {
    if (session) {
      return Folder.findById(folder._id).session(session);
    }
    return Folder.findById(folder._id);
  } else {
    return folder;
  }
}

const constructFilePath = async (file) => {
  let path;

  if (file instanceof Folder) {
    path = file.name;
  } else if (file instanceof Document) {
    path = file.name + "." + file.extension;
  } else {
    throw new ValidationError("Cannot get file path of invalid file");
  }
  await file.populate("parentFolder");
  let parentFolder = file.parentFolder;


  while (parentFolder && parentFolder.name) {
    path = parentFolder.name + "/" + path;
    await parentFolder.populate("parentFolder");
    parentFolder = parentFolder.parentFolder;
  }
  file.depopulate("parentFolder");
  return path;
}

module.exports = {
  createFolder,
  renameFolder,
  moveFolder,
  deleteFolder,
  getFolderContents,
  getAllFolders,
  addFolderContents,
  removeFolderContents,
  constructFilePath,
}