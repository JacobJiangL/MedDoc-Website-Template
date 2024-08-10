const fs = require("fs");
const fsPromises = require("fs").promises;
const path = require("path");
const { pipeline } = require("stream").promises;


const getProjectRootPath = () => {
  return path.join(__dirname, "../../");
}

const getStorageRootPath = () => {
  return path.join(__dirname, "../../uploads");
}

const getFileTreeRootPath = () => {
  return path.join(__dirname, "../../uploads/tree");
}
const getTempStoragePath = () => {
  return path.join(__dirname, "../../uploads/temp");
}


/**
 * Moves a new file from temp to the file tree, renaming it in the process
 * @param {String} fileName 
 * @param {String} newPath 
 */
const moveDocumentAfterCreation = async (fileName, newPath) => {
  const fullTempPath = path.join(getTempStoragePath(), fileName);
  const fullNewPath = path.join(getFileTreeRootPath(), newPath);
  await changeFilePath(fullTempPath, fullNewPath)
}

/**
 * Renames a file, or attempts to recreate under new name in case of fail
 * @param {String} filePath
 * @param {String} oldName 
 * @param {String} newName 
 * @param {String} rootPath 
 */
const renameFile = async (filePath, newName, rootPath=getFileTreeRootPath()) => {
  const directory = path.dirname(filePath);
  const fullName = newName + path.extname(filePath);
  const fullOldPath = path.join(rootPath, filePath);
  const fullNewPath = path.join(rootPath, directory, fullName);
  await changeFilePath(fullOldPath, fullNewPath);
}

/**
 * Moves a file from one path to another, or attempts to recreate in new path in case of fail
 * @param {String} oldPath 
 * @param {String} newPath 
 * @param {String} rootPath 
 */
const moveFile = async (oldPath, newPath, rootPath=getFileTreeRootPath()) => {
  const fullOldPath = path.join(rootPath, oldPath);
  const fullNewPath = path.join(rootPath, newPath);
  await changeFilePath(fullOldPath, fullNewPath);
}

/**
 * Deletes a file from the file tree
 * @param {String} filePath 
 * @param {String} rootPath 
 */
const deleteFile = async (filePath, rootPath=getFileTreeRootPath()) => {
  const absoluteFilePath = path.join(rootPath, filePath);

  const stats = await fsPromises.stat(absoluteFilePath);

  if (stats.isFile()) {
    await fsPromises.unlink(absoluteFilePath);
  } else if (stats.isDirectory()) {
    await fsPromises.rmdir(absoluteFilePath);
  }
}

/**
 * Gets a file from storage and returns it
 * @param {String} filePath 
 * @param {String} rootPath 
 * @returns buffer containing file on success
 */
const getFile = async (filePath, rootPath=getFileTreeRootPath()) => {
  try {
    const fullFilePath = path.join(rootPath, filePath);
    const file = await fsPromises.readFile(fullFilePath);
    
    return file;
  } catch (err) {
    throw new Error(`Error getting file: ${err}`);
  }
}

/**
 * Clears the temp uploads folder of all files
 */
const clearTemp = async () => {
  try {
    const tempFiles = await fsPromises.readdir(getTempStoragePath());

    for (const tempFile of tempFiles) {
      // construct the full path
      const tempFilePath = path.join(getTempStoragePath(), tempFile);

      const stats = await fsPromises.stat(tempFilePath);

      if (stats.isFile()) {
        await fsPromises.unlink(tempFilePath);
        console.log(`Deleted file: ${tempFilePath}`);
      }
    }
  } catch (error) {
    console.error("Error deleting items:", error);
  }
}

/**
 * Creates a new directory/folder
 * @param {String} folderPath 
 * @param {String} rootPath 
 */
const createFolder = async (folderPath, rootPath=getFileTreeRootPath()) => {
  const fullPath = path.join(rootPath, folderPath);
  await fsPromises.mkdir(fullPath);
}

const changeFilePath = async (fullOldPath, fullNewPath) => {
  try {
    // attempt to move file
    await fsPromises.rename(fullOldPath, fullNewPath);
  } catch (err) {
    // attempt to copy file to new path then delete original
    try {
      const readStream = fs.createReadStream(fullOldPath);
      const writeStream = fs.createWriteStream(fullNewPath);
      
      await pipeline(readStream, writeStream);

      await fsPromises.unlink(fullOldPath);
    } catch (err) {
      throw new Error(`Error moving file: ${err}`);
    }
  }
}

module.exports = {
  moveDocumentAfterCreation,
  renameFile,
  moveFile,
  deleteFile,
  getFile,
  clearTemp,
  createFolder,
}