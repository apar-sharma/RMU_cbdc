const User = require("../models/user");
const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const { attachCookiesToResponse, createTokenUser } = require("../utils");
const { Gateway, Wallets } = require("fabric-network");
const FabricCAServices = require("fabric-ca-client");
const path = require("path");
const fs = require("fs");

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

const register = async (req, res, next) => {
  console.log("registering user..........");
  if (!req.body) {
    throw new CustomError.BadRequestError("Please provide proper credentials");
  }
  const { email, name, password } = req.body;

  const emailAlreadyExists = await User.findOne({ email });
  if (emailAlreadyExists) {
    throw new CustomError.BadRequestError("Email already exists");
  }

  const user = await User.create({ name, email, password });
  

  try {
    console.log("creating user in ledger......");
    const userId = user._id;
    if (!userId) return res.status(400).json({ error: "User ID required" });

    const wallet = await Wallets.newFileSystemWallet(walletPath);
    if (await wallet.get(userId)) {
      return res.status(400).json({ error: "User exists" });
    }

    const ca = new FabricCAServices(
      ccp.certificateAuthorities["ca.org1.example.com"].url,
      {
        trustedRoots:
          ccp.certificateAuthorities["ca.org1.example.com"].tlsCACerts.pem,
        verify: false,
      },
      ccp.certificateAuthorities["ca.org1.example.com"].caName
    );

    const adminIdentity = await wallet.get("ca-admin");
    if (!adminIdentity) {
      return res.status(500).json({ error: "CA Admin not initialized" });
    }

    const provider = wallet
      .getProviderRegistry()
      .getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(adminIdentity, "ca-admin");

    const secret = await ca.register(
      {
        affiliation: "org1.department1",
        enrollmentID: userId,
        role: "client",
        attrs: [
          { name: "hf.Registrar.Roles", value: "client" },
          { name: "commonName", value: userId + "@org1.example.com" }, // Add CN
        ],
      },
      adminUser
    );

    const enrollment = await ca.enroll({
      enrollmentID: userId,
      enrollmentSecret: secret,
    });

    await wallet.put(userId, {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId: "Org1MSP",
      type: "X.509",
    });

    res.status(StatusCodes.CREATED).json({ user });
    console.log("User registered successfully");
  } catch (error) {
    throw new CustomError.NotFoundError(error.message);
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new CustomError.BadRequestError("Please provide email and password");
  }
  const user = await User.findOne({ email });

  if (!user) {
    throw new CustomError.UnauthenticatedError("Invalid Credentials");
  }
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new CustomError.UnauthenticatedError("Invalid Credentials");
  }
  const tokenUser = createTokenUser(user);
  // attachCookiesToResponse({ res, user: tokenUser });

  res.status(StatusCodes.OK).json({ user });
};
const logout = async (req, res) => {
  // res.cookie("token", "logout", {
  //   httpOnly: true,
  //   expires: new Date(Date.now() + 1000),
  // });
  res.status(StatusCodes.OK).json({ msg: "user logged out!" });
};

module.exports = {
  register,
  login,
  logout,
};
