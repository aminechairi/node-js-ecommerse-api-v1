const crypto = require("crypto");

const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");

const userModel = require("../../models/userModel");
const createToken = require("../../utils/createToken");
const sendEmail = require("../../utils/sendEmail");
const ApiError = require("../../utils/apiErrore");
const { userPropertysPrivate } = require("../../utils/propertysPrivate");

// @desc    Email verify
// @route   POST /api/v1/auth/emailverify
// @access  User logged in
exports.emailVerify = asyncHandler(async (req, res, next) => {
  // 1) Get user by email
  const user = await userModel.findOne({ email: req.user.email });
  if (!user) {
    return next(
      new ApiError(`There is no user with that email ${req.user.email}`, 404)
    );
  };

  // 2) If user exist, Generate hash email verify code random 6 digits and save it in db
  const emailVerifyCode = Math.floor(
    100000 + Math.random() * 900000
  ).toString();
  const hashedEmailVerifyCode = crypto
    .createHash("sha256")
    .update(emailVerifyCode)
    .digest("hex");

  await userModel.updateOne(
    {
      email: req.user.email,
    },
    {
      // Save hashed email verify code into db
      emailVerifyCode: hashedEmailVerifyCode,
      // Add expiration time for email verify code (10 min)
      emailVerifyCodeExpires: Date.now() + 10 * 60 * 1000,
      emailVerify: false,
    }
  );

  // 3) Send the reset code via email
  const message = `
    <div style="text-align: center;font-family: Arial, Helvetica, sans-serif;color: rgb(56, 56, 56);padding: 20px 0px;">
      <h1 style="margin: 0;padding: 0;font-size: 28px;font-weight: 600;margin-bottom: 4px">
        Hi ${user.firstName} ${user.lastName}
      </h1>
      <p style="margin: 0;padding: 0;font-size: 16px;margin-bottom: 4px">
        Enter this code to confirm your email.
      </p>
      <h2 style="margin: 0;padding: 0;font-size: 24px;font-weight: 600;margin-bottom: 4px">
        ${emailVerifyCode}
      </h2>
    </div>
  `;
  try {
    await sendEmail({
      email: user.email,
      subject: "Your email verify code (valid for 10 min)",
      message,
    });
  } catch (err) {
    await userModel.updateOne(
      {
        email: req.user.email,
      },
      {
        emailVerifyCode: null,
        emailVerifyCodeExpires: null,
      }
    );
    return next(new ApiError("There is an error in sending email", 500));
  };

  res
    .status(200)
    .json({ status: "Success", message: "Verify code sent to email" });
});

// @desc    Email verify code
// @route   POST /api/v1/auth/emailverifycode
// @access  User logged in
exports.emailVerifyCode = asyncHandler(async (req, res, next) => {
  // 1) Get user based on email verify code
  const hashedEmailVerifyCode = crypto
    .createHash("sha256")
    .update(req.body.emailVerifyCode)
    .digest("hex");

  const user = await userModel.findOne({
    emailVerifyCode: hashedEmailVerifyCode,
    emailVerifyCodeExpires: { $gt: Date.now() },
  });
  if (!user) {
    return next(new ApiError("Email verify code invalid or expired"));
  }

  // 2) Email verify valid
  await userModel.updateOne(
    {
      email: user.email,
    },
    {
      emailVerify: true,
      emailVerifyCode: null,
      emailVerifyCodeExpires: null,
    }
  );

  res.json({ status: "Success", message: "Email has been verified." });
});

// @desc Get my data
// @route GET /api/v1/users/mydata
// @access user logged in
exports.getMyData = asyncHandler(async (req, res) => {
  const id = req.user._id;
  const document = await userModel.findById(id);
  const user = userPropertysPrivate(document);
  res.status(200).json({ data: user });
});

// @desc Update my data
// @route PUT /api/v1/users/updatemydata
// @access user logged in
exports.updateMyData = asyncHandler(async (req, res) => {
  const id = req.user._id;
  const document = await userModel.findByIdAndUpdate(
    id,
    {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      slug: req.body.slug,
      phone: req.body.phone,
      profileImage: req.body.profileImage,
      profileCoverImage: req.body.profileCoverImage,
    },
    {
      new: true,
    }
  );
  const user = userPropertysPrivate(document);
  res.status(200).json({ data: user });
});

// @desc Change my password
// @route PUT /api/v1/users/changemypassword
// @access user logged in
exports.changeMyPassword = asyncHandler(async (req, res, next) => {
  const id = req.user._id;
  const userCheck = await userModel.findById(id);
  // Check user exist
  if (!userCheck) {
    return next(new ApiError(`No user for this id ${id}`, 404));
  }
  const isCorrectPassword = await bcrypt.compare(
    req.body.currentPassword,
    userCheck.password
  );
  if (!isCorrectPassword) {
    return next(new ApiError("Incorrect current password", 401));
  };
  const document = await userModel.findByIdAndUpdate(
    id,
    {
      password: await bcrypt.hash(req.body.newPassword, 12),
      passwordChangedAt: Date.now(),
    },
    {
      new: true,
    }
  );
  const user = userPropertysPrivate(document);
  const token = createToken(user._id);
  res.status(200).json({ data: user, token: token });
});

// @desc Change my email
// @route PUT /api/v1/users/changemyemail
// @access user logged in
exports.changeMyEmail = asyncHandler(async (req, res, next) => {
  const id = req.user._id;
  const userCheck = await userModel.findById(id);
  if (!(await bcrypt.compare(req.body.password, userCheck.password))) {
    return next(new ApiError("The password is not incorrect.", 401));
  };
  const document = await userModel.findByIdAndUpdate(
    id,
    {
      email: req.body.newEmail,
      emailVerify: false,
    },
    {
      new: true,
    }
  );
  const user = userPropertysPrivate(document);
  res
    .status(200)
    .json({ date: user });
});