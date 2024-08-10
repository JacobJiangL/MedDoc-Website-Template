const multer = require("multer");
const path = require("path");

const { ValidationError } = require("../errors/errors");

const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../uploads/temp/"));
  },
  filename: (req, file, cb) => {
    let fileName = "";
    if (req.body.name) {
      fileName += "-" + req.body.name;
    }
    const tempFileName = Date.now() + fileName + "-" + file.originalname
    req.tempFileName = tempFileName;
    cb(null, tempFileName);
  }
});

const fileFilter = (req, file, cb) => {
  // .pdf and .docx only
  const allowedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ValidationError('Invalid file type'));
  }
}

const upload = multer({
  storage: tempStorage,
  limits: { fileSize: 1000 * 1000 * 5}, // 5MB
  fileFilter: fileFilter,
});

module.exports = upload;