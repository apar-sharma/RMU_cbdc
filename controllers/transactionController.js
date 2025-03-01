const Transaction = require("../models/transaction");
const User = require("../models/user");
const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const mongoose = require("mongoose");
const { Wallets, Gateway } = require("fabric-network");
const fs = require("fs");
const path = require("path");

const ccpPath = path.resolve(__dirname, "..", "..", "..", "..", "fabric-samples", "test-network", "organizations", "peerOrganizations", "org1.example.com", "connection-org1.json");
const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));
const walletPath = path.join(process.cwd(), "wallet");

async function connectToNetwork(user) {
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    const gateway = new Gateway();
    
    await gateway.connect(ccp, {
        wallet,
        identity: user,
        discovery: { 
            enabled: true, 
            asLocalhost: true,
            // Added TLS settings
            tlsCACerts: Buffer.from(ccp.certificateAuthorities['ca.org1.example.com'].tlsCACerts.pem).toString()
        }
    });
    
    const network = await gateway.getNetwork("mychannel");
    return {
        gateway,
        contract: network.getContract("basic")
    };
}

const createTransaction = async (req, res) => {
  const {
    senderId,
    receiverId,
    amount,
    transactionType,
    description,
    transactionPin,
  } = req.body;

  if (!senderId || !receiverId || !amount || !transactionType || !transactionPin) {
    throw new CustomError.BadRequestError("All fields are required");
  }
  
  let session = null;
  const isProductionDb = process.env.NODE_ENV !== "localhost";
  
  try {
    // Only use transactions with MongoDB Atlas (replica set)
    if (isProductionDb) {
      console.log("Using transactions with MongoDB Atlas");
      session = await mongoose.startSession();
      session.startTransaction();
    }
    
    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);
    
    if (!receiver) {
      throw new CustomError.NotFoundError("Receiver not found");
    }
    
    const isTransactionPinCorrect = await sender.compareTransactionPin(transactionPin);
    if (!isTransactionPinCorrect) {
      throw new CustomError.BadRequestError("Invalid transaction pin");
    }
    
    if (transactionType === "transfer") {
      if (sender.balance < amount) {
        throw new CustomError.BadRequestError("Insufficient balance");
      }
      
      try {
        console.log("User ID for transfer:", senderId);
        const { gateway, contract } = await connectToNetwork(senderId);
        await contract.submitTransaction("TransferTokens", senderId, receiverId, amount);
        await gateway.disconnect();
      } catch (error) {
        throw new CustomError.BadRequestError("Failed to transfer tokens");
      }

      // Update balances
      sender.balance -= amount;
      receiver.balance += amount;

      // Save with or without session
      if (session) {
        await sender.save({ session });
        await receiver.save({ session });
      } else {
        await sender.save();
        await receiver.save();
      }
    }

    let transaction;
    if (session) {
      transaction = await Transaction.create(
        [{
          sender: senderId,
          receiver: receiverId,
          amount,
          transactionType,
          description,
          status: "completed",
        }],
        { session }
      );
      await session.commitTransaction();
      transaction = transaction[0];
    } else {
      transaction = await Transaction.create({
        sender: senderId,
        receiver: receiverId,
        amount,
        transactionType,
        description,
        status: "completed",
      });
    }

    res.status(StatusCodes.CREATED).json({ transaction });
  } catch (error) {
    if (session) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

const getAllTransactions = async (req, res) => {
  const userId = req.params.id;
  console.log(userId);
  const transactions = await Transaction.find({
    $or: [{ sender: userId }, { receiver: userId }],
  })
    .sort({ createdAt: -1 })
    .populate("sender", "name email")
    .populate("receiver", "name email");

  res.status(StatusCodes.OK).json({ transactions });
};

const getSingleTransaction = async (req, res) => {
  const transactionId = req.params.id;
  console.log(transactionId);

  const transaction = await Transaction.findOne({ _id: transactionId })
    .populate("sender", "name email")
    .populate("receiver", "name email");

  if (!transaction) {
    throw new CustomError.NotFoundError(
      `No transaction with id: ${transactionId}`
    );
  }

  res.status(StatusCodes.OK).json({ transaction });
};

module.exports = {
  createTransaction,
  getAllTransactions,
  getSingleTransaction,
};
