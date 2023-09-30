const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required."],
      trim: true,
      minlength: [3, "Too short frist name."],
      maxlength: [16, "Too long frist name."],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required."],
      trim: true,
      minlength: [2, "Too short last name."],
      maxlength: [16, "Too long last name."],
    },
    slug: {
      type: String,
      required: [true, "Slug is required."],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address."],
    },
    emailVerify: {
      type: Boolean,
      default: false,
    },
    emailVerifyCode: String,
    emailVerifyCodeExpires: Date,
    phone: {
      type: String,
      required: [true, "Phone number is required."],
      trim: true,
    },
    profileImage: {
      type: String,
      trim: true,
    },
    profileCoverImage: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required."],
      minlength: [8, "Password should be at least 8 characters long."],
    },
    passwordChangedAt: Date,
    passwordResetCode: String,
    passwordResetExpires: Date,
    passwordResetVerified: Boolean,
    role: {
      type: String,
      enum: ["user", "manager", "admin"],
      default: "user",
    },
    active: {
      type: Boolean,
      default: true,
    },
    userBlock: {
      type: Boolean,
      default: false,
    },
    // child reference (one to many)
    wishlist: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Product",
      },
    ],
    addressesList: [
      {
        id: mongoose.Schema.Types.ObjectId,
        alias: {
          type: String,
          required: [true, "Alias is required."],
          trim: true,
          minlength: [2, "Too short alias."],
          maxlength: [32, "Too long alias."],
        },
        details: {
          type: String,
          required: [true, "Details is required."],
          trim: true,
          minlength: [8, "Too short details."],
          maxlength: [64, "Too long details."]
        },
        phone: {
          type: String,
          required: [true, "Phone number is required."],
        },
        city: {
          type: String,
          required: [true, "City is required."],
          trim: true,
          minlength: [2, "Too short city."],
          maxlength: [32, "Too long city."],
        },
        postalCode: {
          type: String,
          required: [true, "Postal code is required."],
          trim: true,
        },
      },
    ],
  },
  { timestamps: true }
);

const setImageUrl = (doc) => {
  if (doc.profileImage) {
    const imageUrl = `${process.env.BASE_URL}/users/${doc.profileImage}`;
    doc.profileImage = imageUrl;
  };
  if (doc.profileCoverImage) {
    const imageUrl = `${process.env.BASE_URL}/users/${doc.profileCoverImage}`;
    doc.profileCoverImage = imageUrl;
  };
};

// findOne, findAll, update, delete
userSchema.post("init", function (doc) {
  setImageUrl(doc);
});

// create a new category
userSchema.post("save", function (doc) {
  setImageUrl(doc);
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  // Hashing user password
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

module.exports = mongoose.model("User", userSchema);