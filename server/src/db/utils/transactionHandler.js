const mongoose = require("mongoose");

/**
 * Higher-order func for mongoDB transactions
 * @param {Function} operations Func to be wrapped
 * @returns {Function} Wrapped func
 */
const withTransaction = (operations) => {
  return async (...args) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // call wrapped func with session
      const result = await operations(session, ...args);
      await session.commitTransaction();
      await session.endSession();
      if (result) {
        return result;
      }
    } catch (err) {
      await session.abortTransaction();
      await session.endSession();

      // err thrown to async-handler
      throw err;
    }
  };
};

module.exports = {
  withTransaction,
};