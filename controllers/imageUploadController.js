const User = require("../models/user");
const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const multer = require("multer");
const fs = require("fs");

// Configure multer for memory storage (files will be in memory as Buffer objects)
const storage = multer.memoryStorage();

// Set file size limits and allowed file types
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new CustomError.BadRequestError("Only image files are allowed"), false);
  }
};

// // Configure multer with size limits
// const upload = multer({
//   storage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
//   fileFilter,
// });

// Configure multer for handling multiple files
const multiUpload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 102400 }, // 5MB max file size
  fileFilter,
}).fields([
  { name: "profilePhoto", maxCount: 1 },
  { name: "governmentIdImage", maxCount: 1 },
]);

// Complete registration with user data and documents
const completeRegistration = async (req, res) => {
  const userId = req.params.id;
  const { dateOfBirth, governmentIdNumber } = req.body;
  if (!dateOfBirth || !governmentIdNumber) {
    throw new CustomError.BadRequestError("Please provide all required fields");
  }

  if (!req.files || !req.files.profilePhoto || !req.files.governmentIdImage) {
    throw new CustomError.BadRequestError(
      "Please upload both profile photo and government ID"
    );
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new CustomError.NotFoundError(`No user found with id: ${userId}`);
  }

  // Update user document with all provided information
  user.dateOfBirth = dateOfBirth;
  user.governmentIdNumber = governmentIdNumber;

  // Save profile photo
  user.profilePhoto = {
    data: req.files.profilePhoto[0].buffer,
    contentType: req.files.profilePhoto[0].mimetype,
  };

  // Save government ID image
  user.governmentId = {
    data: req.files.governmentIdImage[0].buffer,
    contentType: req.files.governmentIdImage[0].mimetype,
  };

  user.kycStatus = "pending"; // Update KYC status to pending after registration
  await user.save();

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Registration completed successfully",
  });
};

// Get profile photo
const getProfilePhoto = async (req, res) => {
  const userId = req.params.id;

  const user = await User.findById(userId);
  if (!user || !user.profilePhoto || !user.profilePhoto.data) {
    throw new CustomError.NotFoundError("No profile photo found");
  }

  res.set("Content-Type", user.profilePhoto.contentType);
  res.send(user.profilePhoto.data);
};

// Get government ID
const getGovernmentId = async (req, res) => {
  const userId = req.params.id;

  const user = await User.findById(userId);
  if (!user || !user.governmentId || !user.governmentId.data) {
    throw new CustomError.NotFoundError("No government ID found");
  }

  res.set("Content-Type", user.governmentId.contentType);
  res.send(user.governmentId.data);
};

module.exports = {
  getProfilePhoto,
  getGovernmentId,
  multiUpload,
  completeRegistration,
};
