const express = require("express");

const { protect } = require("../middleware/authMiddleware");
const { enforceObjectIds } = require("../middleware/idMiddleware");

const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

const { 
  createDocument, 
  renameDocument, 
  moveDocument, 
  updateDocumentDescription,
  deleteDocument,
  getDocument,
  getAllDocuments,
} = require("../controllers/documentController");


// admin routes
router.post("/", protect("admin"), upload.single("document"), createDocument);
router.put("/:documentId/rename", protect("admin"), enforceObjectIds, renameDocument);
router.put("/:documentId/move", protect("admin"), enforceObjectIds, moveDocument);
router.put("/:documentId/description", protect("admin"), enforceObjectIds, updateDocumentDescription);
router.delete("/:documentId", protect("admin"), enforceObjectIds, deleteDocument);

// user routes
router.get("/:documentId", protect(), enforceObjectIds, getDocument);
router.get("/", protect(), getAllDocuments);

module.exports = router;