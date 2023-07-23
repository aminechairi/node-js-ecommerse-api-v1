const crypto = require("crypto");

const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const userModel = require("../models/userModel");
const ApiErrore = require("../utils/apiErrore");
const createToken = require("../utils/createToken");
const sendEmail = require("../utils/sendEmail");

// @desc Signup
// @route POST /api/v1/auth/signup
// @access Public
exports.signup = asyncHandler(async (req, res, next) => {
  // 1) Create user
  const user = await userModel.create({
    userName: req.body.userName,
    email: req.body.email,
    phone: req.body.phone,
    password: req.body.password,
  });
  // 2) Generate token
  const token = createToken(user._id);
  res.status(201).json({
    data: user,
    token: token,
  });
});

// @desc Login
// @route POST /api/v1/auth/login
// @access Public
exports.login = asyncHandler(async (req, res, next) => {
  const user = await userModel.findOne({
    email: req.body.email,
  });
  if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
    return next(new ApiErrore(`Incorrect email or password`, 401));
  }
  const token = createToken(user._id);
  res.status(200).json({
    data: user,
    token: token,
  });
});

// @desc Make sure the user is logget in
exports.protect = asyncHandler(async (req, res, next) => {
  // 1) Check if token exists, if exists get
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    return next(
      new ApiErrore("You are not login, please login to get access route", 401)
    );
  }
  // 2) Verify token (no change happens, except token)
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  // 3) Check if user exist
  const user = await userModel.findById(decoded.userId);
  if (!user) {
    return next(
      new ApiErrore(
        `The user that belong to this token deos no loger exists`,
        401
      )
    );
  };
  // 4) Check if user change password after token create
  if (user.passwordChangedAt) {
    const passwordChangedTimeStamp = Number.parseInt(
      user.passwordChangedAt.getTime() / 1000, 10
    );
    // 5) Password changed after token create (ERROR)
    if (passwordChangedTimeStamp > decoded.iat) {
      return next(
        new ApiErrore(
          `User recently changed his password plesse login again...`,
          401
        )
      );
    };
  };
  // 5) Check if user active or desactive
  if (!user.active) {
    return next(
      new ApiErrore(
        `This user is not active`,
        401
      )
    );
  }
  req.user = user;
  next();
});

// @desc Authorations (User permessions)
exports.allowedTo = (...roles) =>
  asyncHandler(async (req, res, next) => {
    // 1) Access role
    // 2) Access registered user (req.user.role)
    if (!roles.includes(req.user.role)) {
      return next(new ApiErrore(`You are not allowed access this route`, 403));
    }
    next();
  });

// @desc Forgot password
// @route POST /api/v1/auth/login/forgotpassword
// @access Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  // 1) Get user by email
  const user = await userModel.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new ApiErrore(`There is not user with the email ${req.body.email}`, 404)
    );
  };
  // 2) If user exist, generate hash reset random 6 digits and save it in db
  const randomNumber = [...Array(6)]
    .map((_) => Math.floor(Math.random() * 6) + 1)
    .join("");
  const hashedResetCode = crypto.createHash("sha256")
    .update(randomNumber)
    .digest("hex");
  // Save heshed reset code into db
  user.passwordResetCode = hashedResetCode;
  // Add expiration time for password resey code (10 min)
  user.passwordResetCodeExpires = Date.now() + 10 * 60 * 1000;
  user.passwordResetVerified = false;
  await user.save();
  // 3) Send the reset code via
  const message = `Hi ${user.userName},\n we received a resuist to reset the pasword on your E-shop acount \n ${randomNumber}`;
  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset code (valid for 10 min)",
      message: message,
    });
  } catch (err) {
    user.passwordResetCode = undefined;
    user.passwordResetCodeExpires = undefined;
    user.passwordResetVerified = undefined;
    await user.save();
    return next(
      new ApiErrore(`There is an error in sending email`, 500)
    );
  };
  res.status(200).json({
    status: "Seccess",
    message: "Reset code send to email",
  });
});

// @desc Verify reset code
// @route POST /api/v1/auth/login/verifyresetcode
// @access Public
exports.verifyPassResetCode = asyncHandler(async (req, res, next) => {
  // 1) Get user based on reset code
  const hashedResetCode = crypto
    .createHash("sha256")
    .update(req.body.resetCode)
    .digest("hex");
  const user = await userModel.findOne({
    passwordResetCode: hashedResetCode,
    passwordResetCodeExpires: { $gt: Date.now() }
  });
  if (!user) {
    return next(
      new ApiErrore(`Reset code invalid or expires`, 400)
    );
  };
  // 2) Reset code 
  user.passwordResetVerified = true;
  await user.save();
  res.status(200).json({
    status: `success`,
  });
});

// @desc Reset password
// @route POST /api/v1/auth/login/resetpassword
// @access Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // 1) Get user based on email
  const user = await userModel.findOne({
    email: req.body.email,
  });
  if (!user) {
    return next(
      new ApiErrore(`There is not user with the email ${req.body.email}`, 404)
    );
  };
  // 2) Check if reset code verifed
  if (!user.passwordResetVerified) {
    return next(
      new ApiErrore(`Reset code not verifed`, 400)
    );
  };
  user.password = req.body.newPassword;
  user.passwordResetCode = undefined;
  user.passwordResetCodeExpires = undefined;
  user.passwordResetVerified = undefined;
  await user.save();
  // 3) If everything is ok, generate token
  const token = createToken(user._id);
  res.status(200).json({
    token
  });
});