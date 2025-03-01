const express = require("express");
const router = express.Router();

const {
  getPendingKYCUsers,
  approveKYC,
  rejectKYC,
} = require("../controllers/kycController");


// Get all pending KYC users
router.get("/pending", getPendingKYCUsers);

// Approve a user's KYC
router.post("/approve/:id", approveKYC);

// Reject a user's KYC
router.post("/reject/:id", rejectKYC);

module.exports = router;
