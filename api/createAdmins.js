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

// Import Peer Admin Function
async function importPeerAdmin() {
  try {
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    if (await wallet.get("peer-admin")) return;

    const orgAdminPath = path.join(
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
      "users",
      "Admin@org1.example.com",
      "msp"
    );

    // Load certificate
    const certPath = path.join(orgAdminPath, "signcerts", "cert.pem");
    const cert = fs.readFileSync(certPath).toString();

    // Load private key
    const keyDir = path.join(orgAdminPath, "keystore");
    const keyFiles = fs
      .readdirSync(keyDir)
      .filter((file) => file.endsWith("_sk"));
    if (!keyFiles.length) throw new Error("No private key found");
    const key = fs.readFileSync(path.join(keyDir, keyFiles[0])).toString();

    const identity = {
      credentials: { certificate: cert, privateKey: key },
      mspId: "Org1MSP",
      type: "X.509",
    };
    await wallet.put("peer-admin", identity);
    console.log("Peer admin imported successfully");
  } catch (error) {
    console.error("Failed to import peer admin:", error);
  }
}

// Initialize CA Admin Function
async function initializeCaAdmin() {
  try {
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    if (await wallet.get("ca-admin")) return;

    const caInfo = ccp.certificateAuthorities["ca.org1.example.com"];

    // Fix TLS certificate handling
    const tlsCACert = caInfo.tlsCACerts.pem;
    const ca = new FabricCAServices(
      caInfo.url,
      {
        trustedRoots: tlsCACert,
        verify: false,
      },
      caInfo.caName
    );

    const enrollment = await ca.enroll({
      enrollmentID: "admin",
      enrollmentSecret: "adminpw",
    });

    const identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId: "Org1MSP",
      type: "X.509",
    };
    await wallet.put("ca-admin", identity);
    console.log("CA Admin initialized");
  } catch (error) {
    console.error("CA Admin init failed:", error);
  }
}

// Initialize both admins
async function initializeAdmins() {
  await importPeerAdmin();
  await initializeCaAdmin();
  console.log("Admin initialization completed");
}

module.exports = initializeAdmins;
