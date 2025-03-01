const express = require("express");
const router = express.Router();


const getHomePageData = async (req, res) => {
  const response = {
    message: "CBDC wallet",
  };
  res.status(200).json(response);
};

const getSystemStats = async (req, res) => {

  res.status(200).json({
    activeUsers: 0,
    totalTransactions: 0,
    systemStatus: "operational?"
  });
};

router.get("/", getHomePageData);
router.get("/stats", getSystemStats);

module.exports = router;