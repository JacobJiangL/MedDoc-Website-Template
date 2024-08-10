const uuid = require("uuid");

const Session = require("../models/Session");


const startSession = async (session, passcodeData) => {
  /* store session info and generate cookie */

  const sessionInfo = generateSession(passcodeData.permission);
  
  await storeSessionData(session, sessionInfo);

  return sessionInfo;
}

const generateSession = (permission) => {
  return {
    sessionId: uuid.v4(),
    permission,
    expiryDate: new Date((new Date().getTime()+1000*60*60*24 * 7)),
  };
}

const storeSessionData = async (session, { sessionId, permission, expiryDate }) => {
  try {
    const newSession = await Session.create([{
      sessionId,
      permission,
      expireAt: expiryDate,
    }], { session });
    return newSession;
  } catch (err) {
    throw new Error(`Error storing session data: ${err}`);
  }
}

const getSessionData = async (sessionId) => {
  try {
    const session = await Session.findOne({sessionId});
    return session;
  } catch (err) {
    throw new Error(`Error getting session data: ${err}`);
      
  }
}

const deleteSessionData = async (sessionId) => {
  try {
    await Session.deleteOne({sessionId});
  } catch (err) {
    throw new Error(`Error deleting session data: ${err}`);
  }
}

module.exports = {
  startSession,
  getSessionData,
  deleteSessionData,
}