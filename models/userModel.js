const mongoose = require('mongoose');
var bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      trim: true,
      required: [true, `User name is required`],
      minlength: [3, "Too short user name"],
      maxLength: [32, "Too long user name"],
    },
    slug: {
      type: String,
      lowercase: true,
    },
    email: {
      type: String,
      required: [true, `Email is required`],
      unique: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, `Phone number is required`],
    },
    profileImg: String,
    password: {
      type: String,
      required: [true, `Password is required`],
      minlength: [6, `Too short password`],
      maxlength: [32, `Too long password`],
    },
    passwordChangedAt: Date,
    passwordResetCode: String,
    passwordResetCodeExpires: Date,
    passwordResetVerified: Boolean,
    role: {
      type: String,
      enum: [`user`, `manager`, `admin`],
      default: `user`,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  };
  // hashing user password
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

const setImageUrl = (doc) => {
  if (doc.profileImg) {
    const imageUrl = `${process.env.BASE_URL}/users/${doc.profileImg}`;
    doc.profileImg = imageUrl;
  }
};

// findOne, findAll, update, delete
userSchema.post("init", function (doc) {
  setImageUrl(doc);
});

// create
userSchema.post("save", function (doc) {
  setImageUrl(doc);
});

module.exports = mongoose.model('User', userSchema);