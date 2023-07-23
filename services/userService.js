const sharp = require("sharp");
const asyncHandler = require("express-async-handler");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");

const {
  deleteOne,
  createOne,
  getOne,
  getAll,
} = require("./handlersFactory");
const { uploadSingleImage } = require("../middlewares/uploadImageMiddleware");
const userMudel = require("../models/userModel");
const ApiErrore = require("../utils/apiErrore");
const createToken = require("../utils/createToken");

// Upload single image
exports.uploadUserImage = uploadSingleImage("profileImg");

// Image processing
exports.resizeImage = asyncHandler(async (req, res, next) => {
  const fileName = `user-${uuidv4()}-${Date.now()}.jpeg`;
  if (req.file) {
    await sharp(req.file.buffer)
      .toFormat("jpeg")
      .toFile(`uploads/users/${fileName}`);
    // Save Image to Into Our db
    req.body.profileImg = `${fileName}`;
  }
  next();
});

// @desc Get list of users
// @route GET /api/v1/users
// @access Private/admin
exports.getUsers = getAll(userMudel);

// @desc Get user by id
// @route GET /api/v1/users/:id
// @access Private
exports.getUser = getOne(userMudel);

// @desc Create User
// @route POST /api/v1/users
// @access Private
exports.createUser = createOne(userMudel);

// @desc Update specific User
// @route PUT /api/v1/users/:id
// @access Private
exports.updateUser = asyncHandler(async (req, res, next) => {
  const active = req.body.active === "true" ? true : req.body.active === "false" ? false : undefined;
  const document = await userMudel.findByIdAndUpdate(
    req.params.id,
    {
      userName: req.body.userName,
      slug: req.body.slug,
      email: req.body.email,
      phone: req.body.phone,
      profileImg: req.body.profileImg,
      role: req.body.role,
      active: active,
    },
    {
      new: true,
    }
  );
  if (!document) {
    return next(new ApiErrore(`No document for this id ${req.params.id}`, 404));
  }
  res.status(200).json({
    data: document,
  });
});

// @desc Change user password
// @route PUT /api/v1/users/changepassword/:id
// @access Private
exports.changeUserPassword = asyncHandler(async (req, res, next) => {
  const user = await userMudel.findByIdAndUpdate(
    req.params.id,
    {
      password: await bcrypt.hash(req.body.password, 12),
      passwordChangedAt: Date.now()
    },
    {
      new: true,
    }
  );
  if (!user) {
    return next(new ApiErrore(`No user for this id ${req.params.id}`, 404));
  }
  res.status(200).json({
    data: user,
  });
});

// @desc Delete specific User
// @route DELETE /api/v1/users/:id
// @access Private
exports.deleteUser = deleteOne(userMudel);

// @desc Get logged User Data
// @route GET /api/v1/users/getme
// @access Private
exports.getLoggedUserData = asyncHandler(async (req, res, next) => {
  req.params.id = req.user._id;
  next();
});

// @desc Update logged user password
// @route POST /api/v1/auth/login/updatemypassword
// @access Private
exports.updateLoggedUserPassword = asyncHandler(async (req, res, next) => {
  const user = await userMudel.findByIdAndUpdate(
    req.user._id,
    {
      password: await bcrypt.hash(req.body.password, 12),
      passwordChangedAt: Date.now(),
    },
    {
      new: true,
    }
  );
  if (!user) {
    return next(new ApiErrore(`No user for this id ${req.params.id}`, 404));
  };
  const token = createToken(user._id);
  res.status(200).json({
    date: user,
    token
  });
});

// @desc Update logged user data (without password, role)
// @route PUT /api/v1/auth/login/updateme
// @access Private
exports.updateLoggedUserData = asyncHandler(async (req, res, next) => {
  const updatedUser = await userMudel.findByIdAndUpdate(
    req.user._id,
    {
      userName: req.body.userName,
      email: req.body.email,
      phone: req.body.phone,
    },
    { new: true }
  );
  res.status(200).json({ data: updatedUser });
});