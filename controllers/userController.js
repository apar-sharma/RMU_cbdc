const User = require("../models/user");
const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const {
  createTokenUser,
  attachCookiesToResponse,
  checkPermissions,
} = require("../utils");

const getAllUsers = async (req, res) => {
  console.log(req.user);
  const users = await User.find({ role: "user" }).select("-password");
  res.status(StatusCodes.OK).json({ users });
};


const getUser = async (req, res) => {
  const user = await User.findOne({ _id: req.params.id }).select("-password -profilePhoto -governmentId");

  if (!user) {
    throw new CustomError.NotFoundError(`No user with id: ${userId}`);
  }

  res.status(StatusCodes.OK).json({ user });
};
// update user with user.save()
const updateUser = async (req, res) => {
  const { email, name } = req.body;
  if (!email || !name) {
    throw new CustomError.BadRequestError("Please provide all values");
  }
  const user = await User.findOne({ _id: req.user.userId });

  user.email = email;
  user.name = name;

  await user.save();

  const tokenUser = createTokenUser(user);
  // attachCookiesToResponse({ res, user: tokenUser });
  res.status(StatusCodes.OK).json({ user: tokenUser });
};
const setPin = async (req, res) => {
  const { transactionPin, userId } = req.body;
  if (!transactionPin) {
    throw new CustomError.BadRequestError("Please provide a transaction pin");
  }
  const user = await User.findOne({ _id: userId });
  user.transactionPin = transactionPin;
  await user.save();
  res.status(StatusCodes.OK).json({ msg: "Success! Transaction Pin Set." });
};
const updateUserPassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    throw new CustomError.BadRequestError("Please provide both values");
  }
  const user = await User.findOne({ _id: req.user.userId });

  const isPasswordCorrect = await user.comparePassword(oldPassword);
  if (!isPasswordCorrect) {
    throw new CustomError.UnauthenticatedError("Invalid Credentials");
  }
  user.password = newPassword;

  await user.save();
  res.status(StatusCodes.OK).json({ msg: "Success! Password Updated." });
};

const getBalance = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId)
      .select("balance")
      .maxTimeMS(30000)
      .catch(async (error) => {
        if (error.code === "ECONNRESET" || error.name === "MongooseError") {
          // Wait and retry once
          console.log("Retrying...");
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return await User.findById(userId).select("balance");
        }
        throw error;
      });

    if (!user) {
      throw new CustomError.NotFoundError(`No user with id: ${userId}`);
    }

    res.status(StatusCodes.OK).json({ balance: user.balance });
  } catch (error) {
    console.error("Balance fetch error:", error);
    if (error.name === "CastError") {
      throw new CustomError.BadRequestError("Invalid user ID format");
    }
    throw error;
  }
};

module.exports = {
  getAllUsers,
  getBalance,
  getUser,
  updateUser,
  setPin,
  updateUserPassword,
};

// update user with findOneAndUpdate
// const updateUser = async (req, res) => {
//   const { email, name } = req.body;
//   if (!email || !name) {
//     throw new CustomError.BadRequestError('Please provide all values');
//   }
//   const user = await User.findOneAndUpdate(
//     { _id: req.user.userId },
//     { email, name },
//     { new: true, runValidators: true }
//   );
//   const tokenUser = createTokenUser(user);
//   attachCookiesToResponse({ res, user: tokenUser });
//   res.status(StatusCodes.OK).json({ user: tokenUser });
// };
