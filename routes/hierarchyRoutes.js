const express = require("express");
const router = express.Router();
const {
  getTransactionHierarchy,
} = require("../controllers/hierarchyController");

// Route to get transaction hierarchy with a specific root user
router.get("/:rootUserId", getTransactionHierarchy);

module.exports = router;
