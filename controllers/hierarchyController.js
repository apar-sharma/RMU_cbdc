const Transaction = require("../models/transaction");
const User = require("../models/user");
const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const mongoose = require("mongoose");

// Helper function to build the transaction hierarchy recursively
async function buildHierarchy(userId) {
  try {
    // Get user information
    const user = await User.findById(userId);
    if (!user) {
      throw new CustomError.NotFoundError(`No user with id: ${userId}`);
    }

    // Find all transactions sent by this user
    const transactions = await Transaction.find({
      sender: userId
    });

    // Group transactions by receiver
    const receiverMap = new Map();

    transactions.forEach((transaction) => {
      const receiverId = transaction.receiver.toString();

      if (!receiverMap.has(receiverId)) {
        receiverMap.set(receiverId, 0);
      }

      receiverMap.set(
        receiverId,
        receiverMap.get(receiverId) + transaction.amount
      );
    });

    // Base structure with user details
    const result = {
      name: user.name,
      budget:
        receiverMap.size > 0
          ? Array.from(receiverMap.values()).reduce((a, b) => a + b, 0)
          : user.balance,
      children: [],
    };

    // If there are no transactions, return the result without children
    if (receiverMap.size === 0) {
      return result;
    }

    // Recursively build the hierarchy for each receiver
    const children = await Promise.all(
      Array.from(receiverMap.keys()).map(async (receiverId) => {
        const childHierarchy = await buildHierarchy(receiverId);

        // Override the budget with the actual transaction amount to this receiver
        childHierarchy.budget = receiverMap.get(receiverId);

        return childHierarchy;
      })
    );

    result.children = children;
    return result;
  } catch (error) {
    console.error("Error building hierarchy:", error);
    throw error;
  }
}

// Controller method to get the transaction hierarchy
const getTransactionHierarchy = async (req, res) => {
  try {
    const rootUserId = req.params.rootUserId;

    if (!mongoose.Types.ObjectId.isValid(rootUserId)) {
      throw new CustomError.BadRequestError("Invalid user ID format");
    }

    const hierarchy = await buildHierarchy(rootUserId);

    res.status(StatusCodes.OK).json(hierarchy);
  } catch (error) {
    console.error("Hierarchy generation error:", error);
    throw error;
  }
};

module.exports = {
  getTransactionHierarchy,
};
