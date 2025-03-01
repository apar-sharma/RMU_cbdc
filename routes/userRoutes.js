const express = require("express");
const router = express.Router();

const {
  getAllUsers,
  getSingleUser,
  getBalance,
  getUser,
  updateUser,
  setPin,
  updateUserPassword,
} = require("../controllers/userController");
const {
  register,
  login,
  logout,
} = require("../controllers/userAuthController");

router.route("/").get(getAllUsers);

router.route("/showMe/:id").get(getUser);
router.route("/updateUser").patch(updateUser);
router.route("/updateUserPassword").patch(updateUserPassword);
router.route("/setPin").post(setPin);

router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);
router.get("/getBalance/:id", getBalance);

module.exports = router;
