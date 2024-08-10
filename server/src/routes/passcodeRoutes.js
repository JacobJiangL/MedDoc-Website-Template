const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const { 
  createPasscode, 
  verifyPasscode, 
  deletePasscode,
  testPasscode, 
} = require("../controllers/passcodeController");

router.post("/", protect("admin"), createPasscode);
router.post("/verify", verifyPasscode);
router.delete("/:passcodeId", protect("admin"), deletePasscode);
router.get("/test", protect("admin"), testPasscode);

module.exports = router;