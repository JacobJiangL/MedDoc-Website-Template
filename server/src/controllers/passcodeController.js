const asyncHandler = require("express-async-handler");
const uuid = require("uuid");
const cookieParser = require("cookie-parser");

const service = require("../services/passcodeService");
const sessionService = require("../services/sessionService");

const Passcode = require("../models/Passcode");

const { MissingFieldsError } = require("../errors/errors");


// @desc    Add new passcode
// @route   POST /api/passcodes
// @access  Protected, ADMIN
const createPasscode = asyncHandler(async (req, res) => {
  const { passcode, permission, note="" } = req.body;

  // all fields required
  if (!passcode||!permission) {
    throw new MissingFieldsError();
  }

  const newPasscode = await service.createPasscode(passcode, permission, note);

  if (newPasscode) {
    res.status(201).json({ 
      _id: newPasscode.id,
      message: "Successfully created new passcode.",
      permission: newPasscode.permission,
      creationDate: newPasscode.creationDate,
    });
  } else {
    throw new Error("Passcode creation failed.")
  }
});

// @desc    Verify passcode
// @route   POST /api/passcodes/verify
// @access  Public
const verifyPasscode = asyncHandler(async (req, res) => {
  const { passcode } = req.body;
  
  // all fields required
  if (!passcode) {
    throw new MissingFieldsError();
  }
  
  const { passcodeData, sessionInfo } = await service.verifyPasscodeAndStartSession(passcode);

  res.cookie("sessionId", sessionInfo.sessionId, { 
    httpOnly: true, 
    signed: true, 
    sameSite: "lax", 
    maxAge: sessionInfo.expiryDate - new Date(),
  });
  res.status(200).json({
    message: "Successfully verified passcode.", 
    permission: passcodeData.permission,
  });
});

// @desc    Delete a passcode
// @route   DELETE /api/passcodes
// @access  Protected, ADMIN
const deletePasscode = asyncHandler(async (req, res) => {
  const { passcodeId } = req.params;

  const success = await service.deletePasscode(passcodeId);

  if (success) {
    res.status(200).json({message: "Delete successful"});
  } else {
    throw new Error("Passcode not found");
  }
});

// @desc    test
// @route   GET /api/passcodes/test
// @access  Protected, ADMIN
const testPasscode = asyncHandler(async (req, res) => {
  res.json({message: "WWWWWW"});
});


module.exports = {
  createPasscode,
  verifyPasscode,
  deletePasscode,
  testPasscode,
};