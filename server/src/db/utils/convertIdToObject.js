const mongoose = require("mongoose");

/**
 * Converts string representation of mongoose/mongoDB ID to an ObjectId object
 * @param {String} stringId 
 * @returns {ObjectId} ObjectId containing the string ID
 */
const convertIdToObject = (stringId) => {
  if (mongoose.Types.ObjectId.isValid(stringId)) {
    return mongoose.Types.ObjectId.createFromHexString(stringId);
  } else {
    return stringId;
  }
}

module.exports = convertIdToObject;