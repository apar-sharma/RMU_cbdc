const express = require("express");
const router = express.Router();
const { mintToken } = require("../controllers/mintController");

router.post("/", mintToken);

module.exports = router;
