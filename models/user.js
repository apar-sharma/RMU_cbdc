const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide name"],
      minlength: 3,
      maxlength: 50,
    },
    email: {
      type: String,
      unique: true,
      required: [true, "Please provide email"],
      validate: {
        validator: validator.isEmail,
        message: "Please provide valid email",
      },
    },
    password: {
      type: String,
      required: [true, "Please provide password"],
      minlength: 6,
    },
    transactionPin: {
      type: String,
      minlength: 4,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    role: {
      type: String,
      enum: ["admin", "bank", "user"],
      default: "user",
    },
    profilePhoto: {
      data: Buffer,
      contentType: String,
    },
    dateOfBirth: {
      type: String,
    },
    governmentIdNumber: {
      type: String,
      trim: true,
    },
    governmentId: {
      data: Buffer,
      contentType: String,
    },
    kycStatus: {
      type: String,
      enum: ["not_submitted", "pending", "approved", "rejected"],
      default: "not_submitted",
    },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function () {
  // console.log(this.modifiedPaths());
  // console.log(this.isModified('name'));
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  if (this.isModified("transactionPin")) {
    const salt = await bcrypt.genSalt(10);
    this.transactionPin = await bcrypt.hash(this.transactionPin, salt);
  }
});

UserSchema.methods.comparePassword = async function (canditatePassword) {
  const isMatch = await bcrypt.compare(canditatePassword, this.password);
  return isMatch;
};
UserSchema.methods.compareTransactionPin = async function (candidatePin) {
  const isMatch = await bcrypt.compare(candidatePin, this.transactionPin);
  return isMatch;
};

module.exports = mongoose.model("User", UserSchema);
