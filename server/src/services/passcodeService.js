const bcrypt = require("bcryptjs");

const Passcode = require("../models/Passcode");

const { ResourceExistsError, NotAuthenticatedError } = require("../errors/errors");
const { withTransaction } = require("../db/utils/transactionHandler");

const sessionService = require("./sessionService");

const createPasscode = async (passcode, permission, note) => {
  
  // passcode already exists
  const passcodes = await Passcode.find({});
  for (const hashedPasscode of passcodes) {
    // check passcode already exists
    if (await bcrypt.compare(passcode, hashedPasscode.passcode)) {
      throw new ResourceExistsError("Email is registered to an existing account.");
    }
  }

  // hash & salt passcode
  const hashedPasscode = await bcrypt.hash(passcode, 10); // 10 round salt

  const newPasscode = await Passcode.create({
    passcode: hashedPasscode,
    permission,
    note,
  });
  return newPasscode;
}

const verifyPasscodeAndStartSession = withTransaction(async (session, passcode) => {

  const passcodeData = await verifyPasscode(session, passcode);

  const sessionInfo = await sessionService.startSession(session, passcodeData);

  return { passcodeData, sessionInfo };
});


const deletePasscode = async (passcodeId) => {
  if (!passcodeId) {
    throw new Error("Passcode ID missing");
  }
  const deleted = await Passcode.findByIdAndDelete(passcodeId);
  
  return deleted;
}

const verifyPasscode = async (session, passcode) => {
  // compare all passcodes with entered passcode
  const passcodes = await Passcode.find({}).session(session);

  for (const passcodeData of passcodes) {
    if (await bcrypt.compare(passcode, passcodeData.passcode)) {
      // return matching passcode data
      return passcodeData;
    }
  }
  throw new NotAuthenticatedError("Wrong passcode");
}

module.exports = {
  createPasscode,
  verifyPasscodeAndStartSession,
  deletePasscode,
}