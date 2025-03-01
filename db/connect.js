const mongoose = require("mongoose");

const connectDB = async (url) => {
  await mongoose.connect(url);

  // Event listeners for connection health
  mongoose.connection.on("disconnected", () => {
    console.log("MongoDB connection lost. Attempting to reconnect...");
    mongoose
      .connect(url)
      .catch((err) => console.error("Reconnection failed:", err));
  });
  return mongoose.connection;
};

module.exports = connectDB;
