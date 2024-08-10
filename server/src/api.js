const express = require('express');

const errorHandler = require("./middleware/errorMiddleware");

const passcodeRoutes = require("./routes/passcodeRoutes");
const folderRoutes = require("./routes/folderRoutes");
const documentRoutes = require("./routes/documentRoutes");

/* routes */

const router = express.Router();


router.use("/passcodes", passcodeRoutes);
router.use("/folders", folderRoutes);
router.use("/documents", documentRoutes);

router.use(errorHandler);


module.exports = router;