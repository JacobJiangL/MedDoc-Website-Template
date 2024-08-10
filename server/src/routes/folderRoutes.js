const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { restrictRootFolder } = require("../middleware/folderMiddleware");
const { enforceObjectIds } = require("../middleware/idMiddleware");


const { 
  createFolder,
  renameFolder,
  moveFolder,
  deleteFolder,
  getFolderContents,
  getAllFolders,
} = require("../controllers/folderController");


// admin routes
router.post("/:folderId", protect("admin"), enforceObjectIds, createFolder);
router.put("/:folderId/rename", protect("admin"), restrictRootFolder, enforceObjectIds, renameFolder);
router.put("/:folderId/move", protect("admin"), restrictRootFolder, enforceObjectIds, moveFolder);
router.delete("/:folderId", protect("admin"), restrictRootFolder, enforceObjectIds, deleteFolder);

// user routes
router.get("/:folderId", protect(), enforceObjectIds, getFolderContents);
router.get("/", protect(), getAllFolders);

module.exports = router;