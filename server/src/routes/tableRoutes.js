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
} = require("../controllers/tableController");


// admin routes
// table
router.post("/", protect("admin"), createTable);
router.post("/:tableId/export-values", exportTableValues);
router.delete("/:tableId", protect("admin"), enforceObjectIds, deleteTable);
// columns
router.post("/:tableId/columns", protect("admin"), enforceObjectIds, addColumnn);
router.post("/:tableId/columns/export-values", enforceObjectIds, exportColumnValues);
router.put("/:tableId/columns", protect("admin"), enforceObjectIds, moveColumn);
router.put("/:tableId/columns/import-values", enforceObjectIds, importValuesIntoColumn);
router.delete("/:tableId/columns", protect("admin"), enforceObjectIds, deleteColumn);
// rows
router.post("/:tableId/rows", protect("admin"), enforceObjectIds, addRow);
router.put("/:tableId/rows", protect("admin"), enforceObjectIds, moveRow);
router.delete("/:tableId/rows", protect("admin"), enforceObjectIds, deleteRow);

// edit cell
router.put("/:tableId", protect("admin"), enforceObjectIds, editCell);
router.put("/:tableId/insert-values", protect("admin"), enforceObjectIds, insertValuesIntoCell);


// user routes
router.get("/:tableId", protect(), enforceObjectIds, getTable);

module.exports = router;