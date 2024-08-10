const asyncHandler = require("express-async-handler");

const { getSessionData } = require("../services/sessionService");

const { NotAuthenticatedError, NotAuthorizedError } = require("../errors/errors");


const protect = (requiredPermission="user") => asyncHandler(async (req, res, next) => {
  
  // get session id from cookie
  sessionId = req.signedCookies.sessionId;

  // get session data
  const sessionData = await getSessionData(sessionId);

  // check if session exists or is expired
  if (!sessionData||sessionData.expireAt.getTime() < Date.now()) {
    throw new NotAuthenticatedError("User not verified.");
  }
  // check if user has required permission
  if (sessionData.permission !== "admin" && requiredPermission === "admin") {
    throw new NotAuthorizedError("User not authorized.");
  }

  req.permission = sessionData.permission;
  
  next();
})

module.exports = {
  protect,
}