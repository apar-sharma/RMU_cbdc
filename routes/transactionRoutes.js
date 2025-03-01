const express = require("express");
const router = express.Router();
const {
  createTransaction,
  getAllTransactions,
  getSingleTransaction,
} = require("../controllers/transactionController");

router.post("/", createTransaction);

router.route("/getSingleTransaction/:id").get(getSingleTransaction);

router.get("/:id", getAllTransactions);

module.exports = router;
