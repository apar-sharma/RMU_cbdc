const express = require("express");
const router = express.Router();

const {
  getProfilePhoto,
  getGovernmentId,
  multiUpload,
  completeRegistration,
} = require("../controllers/imageUploadController");

// Get image routes
router.get("/profile/:id", getProfilePhoto);
router.get("/government-id/:id", getGovernmentId);

// Complete registration route - handles multiple files and data
// This route allows sending userId in params and DOB, governmentID number,
// governmentId image and profile photo in the same request
router.post("/complete-registration/:id", multiUpload, completeRegistration);

module.exports = router;
