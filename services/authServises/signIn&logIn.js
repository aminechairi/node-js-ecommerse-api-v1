const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");

const userModel = require("../../models/userModel");
const ApiError = require("../../utils/apiErrore");
const createToken = require("../../utils/createToken");
const { userPropertysPrivate } = require("../../utils/propertysPrivate");

// @desc Sign up
// @route POST /api/v1/auth/signup
// @access Public
exports.signUp = asyncHandler(async (req, res) => {
  // 1 - Create user
  const document = await userModel.create({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    slug: req.body.slug,
    email: req.body.email,
    phone: req.body.phone,
    password: req.body.password,
  });
  const user = userPropertysPrivate(document);
  // 2 - Create token
  const token = createToken(user._id);
  res.status(201).json({
    date: user,
    token: token,
  });
});

// @desc Log in
// @route POST /api/v1/auth/login
// @access Public
exports.logIn = asyncHandler(async (req, res, next) => {
  // 1) check if password and email in the body (validation)
  // 2) check if user exist & check if password is correct
  const document = await userModel.findOne({ email: req.body.email });

  if (!document || !(await bcrypt.compare(req.body.password, document.password))) {
    return next(new ApiError("Incorrect email or password.", 401));
  };

  if (document.userBlock) {
    return next(new ApiError("The user has been banned.", 401));
  };

  const user = userPropertysPrivate(document);

  // 3) generate token
  const token = createToken(user._id);
  
  // 4) send response to client side
  res.status(200).json({ data: user, token });
});