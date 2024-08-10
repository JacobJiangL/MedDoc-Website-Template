const asyncHandler = require("express-async-handler");
const convertIdToObject = require("../db/utils/convertIdToObject");

const enforceObjectIds = asyncHandler(async (req, res, next) => {
  for (const [key, value] of Object.entries(req.params)) {
    if (value instanceof String || typeof value === "string") {
      req.params[key] = convertIdToObject(value);
    }
  }
  for (const [key, value] of Object.entries(req.body)) {
    if (value instanceof String || typeof value === "string") {
      req.body[key] = convertIdToObject(value);
    }
  }

  next()
});

module.exports = {
  enforceObjectIds,
}
