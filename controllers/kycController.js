const User = require("../models/user");
const { StatusCodes } = require("http-status-codes");
const {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} = require("../errors");

const getPendingKYCUsers = async (req, res) => {

  const pendingUsers = await User.find({ kycStatus: "pending" }).select(
    "-password -transactionPin -profilePhoto -governmentId"
  );

  res.status(StatusCodes.OK).json({
    count: pendingUsers.length,
    pendingUsers,
  });
};

const approveKYC = async (req, res) => {
  const { id: userId } = req.params;

  // Only admin and bank roles should modify KYC status
  if (req.user.role !== "admin" && req.user.role !== "bank") {
    throw new UnauthorizedError("Not authorized to perform this action");
  }

  const user = await User.findOne({ _id: userId });

  if (!user) {
    throw new NotFoundError(`No user with id: ${userId}`);
  }

  if (user.kycStatus !== "pending") {
    throw new BadRequestError("User KYC is not in pending state");
  }

  user.kycStatus = "approved";
  await user.save();

  res.status(StatusCodes.OK).json({
    message: "KYC approved successfully",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      kycStatus: user.kycStatus,
    },
  });
};

const rejectKYC = async (req, res) => {
  const { id: userId } = req.params;

  // Only admin and bank roles should modify KYC status
  if (req.user.role !== "admin" && req.user.role !== "bank") {
    throw new UnauthorizedError("Not authorized to perform this action");
  }

  const user = await User.findOne({ _id: userId });

  if (!user) {
    throw new NotFoundError(`No user with id: ${userId}`);
  }

  if (user.kycStatus !== "pending") {
    throw new BadRequestError("User KYC is not in pending state");
  }

  user.kycStatus = "rejected";
  await user.save();

  res.status(StatusCodes.OK).json({
    message: "KYC rejected",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      kycStatus: user.kycStatus,
    },
  });
};

module.exports = {
  getPendingKYCUsers,
  approveKYC,
  rejectKYC,
};
