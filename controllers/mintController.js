const User = require("../models/user");
const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const { Gateway, Wallets } = require("fabric-network");
const path = require("path");
const fs = require("fs");

// Configuration paths
const ccpPath = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "fabric-samples",
  "test-network",
  "organizations",
  "peerOrganizations",
  "org1.example.com",
  "connection-org1.json"
);
const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));
const walletPath = path.join(process.cwd(), "wallet");

// Helper function to connect to the network
async function connectToNetwork(user) {
  const wallet = await Wallets.newFileSystemWallet(walletPath);
  const gateway = new Gateway();

  await gateway.connect(ccp, {
    wallet,
    identity: user,
    discovery: {
      enabled: true,
      asLocalhost: true,
      tlsCACerts: Buffer.from(
        ccp.certificateAuthorities["ca.org1.example.com"].tlsCACerts.pem
      ).toString(),
    },
  });

  const network = await gateway.getNetwork("mychannel");
  return {
    gateway,
    contract: network.getContract("basic"),
  };
}

const mintToken = async (req, res) => {
  try {
    const { userId, amount } = req.body;

    if (!userId || !amount) {
      throw new CustomError.BadRequestError("User ID and amount are required");
    }

    // Find user in MongoDB
    const user = await User.findById(userId);
    if (!user) {
      throw new CustomError.NotFoundError(`No user found with id: ${userId}`);
    }

    // Get user's identity from the wallet
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    const userIdentity = await wallet.get(userId);
    if (!userIdentity) {
      throw new CustomError.NotFoundError(
        "User not found in blockchain wallet"
      );
    }

    // Parse certificate to extract identity
    const { X509Certificate } = await import("node:crypto");
    const cert = new X509Certificate(userIdentity.credentials.certificate);

    // Extract Common Name safely
    const subject = cert.subject
      .split("\n")
      .find((line) => line.startsWith("CN="));
    if (!subject) {
      throw new CustomError.BadRequestError(
        "Common Name not found in certificate"
      );
    }
    const accountId = subject.split("=")[1].split("@")[0];

    // 1. First mint tokens in blockchain
    const { gateway, contract } = await connectToNetwork("peer-admin");
    await contract.submitTransaction(
      "IssueTokens",
      accountId,
      parseFloat(amount).toFixed(2)
    );
    await gateway.disconnect();

    // 2. Update user balance in MongoDB
    const parsedAmount = parseFloat(amount);
    user.balance += parsedAmount; // Set balance to minted amount
    await user.save();

    res.status(StatusCodes.OK).json({
      message: "Tokens minted successfully",
      userId: userId,
      balance: user.balance,
    });
  } catch (error) {
    console.error("Minting error:", error);
    if (error instanceof CustomError.CustomAPIError) {
      throw error;
    }
    throw new CustomError.InternalServerError(
      `Minting failed: ${error.message}`
    );
  }
};

module.exports = {
  mintToken,
};
