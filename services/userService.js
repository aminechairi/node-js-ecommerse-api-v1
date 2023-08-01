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
const {
  uploadMultipleImages,
} = require("../middlewares/uploadImageMiddleware");
const userMudel = require("../models/userModel");

// Upload multiple images
exports.uploadUserImages = uploadMultipleImages([
  {
    name: "profileImage",
    maxCount: 1,
  },
  {
    name: "profileCoverImage",
    maxCount: 1,
  },
]);

// Images processing
exports.resizeUserImages = asyncHandler(async (req, res, next) => {
  // 1 - Image processing for profileImage
  if (req.files.profileImage) {
    const profileImageFileName = `users-${uuidv4()}-${Date.now()}.jpeg`;
    await sharp(req.files.profileImage[0].buffer)
      .resize(800, 800)
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toFile(`uploads/users/${profileImageFileName}`);
    // Save profileImage to Into Our db
    req.body.profileImage = `${profileImageFileName}`;
  }
  // 2 - Image processing for profileCoverImage
  if (req.files.profileCoverImage) {
    const profileCoverImageFileName = `users-${uuidv4()}-${Date.now()}.jpeg`;
    await sharp(req.files.profileCoverImage[0].buffer)
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toFile(`uploads/users/${profileCoverImageFileName}`);
    // Save profileCoverImage to Into Our db
    req.body.profileCoverImage = `${profileCoverImageFileName}`;
  }
  next();
});

// @desc Get list of users
// @route GET /api/v1/users
// @access Private admine
exports.getUsers = getAll(userMudel);

// @desc Get user by id
// @route GET /api/v1/users/:id
// @access Private admine
exports.getUser = getOne(userMudel);

// @desc Create user
// @route POST /api/v1/users
// @access Private admine
exports.createUser = createOne(userMudel);

// @desc Update specific user
// @route PUT /api/v1/users/:id
// @access Private admine
exports.updateUser = asyncHandler(async (req, res, next) => {
  const document = await userMudel.findByIdAndUpdate(
    req.params.id,
    {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      slug: req.body.slug,
      email: req.body.email,
      phone: req.body.phone,
      profileImage: req.body.profileImage,
      profileCoverImage: req.body.profileCoverImage,
      role: req.body.role,
    },
    {
      new: true,
    }
  );
  if (!document) {
    return next(new ApiError(`No document for this id ${req.params.id}`, 404));
  }
  res.status(200).json({ data: document });
});

// @desc Change user password
// @route PUT /api/v1/users/changepassword/:id
// @access Private admine
exports.changeUserPassword = asyncHandler(async (req, res, next) => {
  const document = await userMudel.findByIdAndUpdate(
    req.params.id,
    {
      password: await bcrypt.hash(req.body.newPassword, 12),
      passwordChangedAt: Date.now(),
    },
    {
      new: true,
    }
  );
  if (!document) {
    return next(new ApiError(`No document for this id ${req.params.id}`, 404));
  }
  res.status(200).json({ data: document });
});

// @desc Delete specific user
// @route DELETE /api/v1/users/:id
// @access Private admine
exports.deleteUser = deleteOne(userMudel);