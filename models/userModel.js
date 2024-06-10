const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const s3Client = require('../config/s3Client');

const awsBuckName = process.env.AWS_BUCKET_NAME;
const expiresIn = process.env.EXPIRE_IN;

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
    emailVerification: {
      type: Boolean,
      default: false,
    },
    emailVerificationCode: String,
    emailVerificationCodeExpires: Date,
    phoneNumber: {
      type: String,
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

const setImageUrl = async (doc) => {

  if (doc.profileImage) {
  
    const getObjectParams = {
      Bucket: awsBuckName,
      Key: `users/${doc.profileImage}`,
    };
  
    const command = new GetObjectCommand(getObjectParams);
    const imageUrl = await getSignedUrl(s3Client, command, { expiresIn });
  
    doc.profileImage = imageUrl;
    
  };

  if (doc.profileCoverImage) {
  
    const getObjectParams = {
      Bucket: awsBuckName,
      Key: `users/${doc.profileCoverImage}`,
    };
  
    const command = new GetObjectCommand(getObjectParams);
    const imageUrl = await getSignedUrl(s3Client, command, { expiresIn });
  
    doc.profileCoverImage = imageUrl;

  };

};

// findOne, findAll, update, delete
userSchema.post("init", async function (doc) {
  await setImageUrl(doc);
});

// create
userSchema.post("save", async function (doc) {
  await setImageUrl(doc);
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  // Hashing user password
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

module.exports = mongoose.model("User", userSchema);