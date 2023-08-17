const sharp = require("sharp");
const asyncHandler = require("express-async-handler");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");

const userModel = require("../../models/userModel");
const ApiError = require("../../utils/apiErrore");
const {
  getAll,
  createOne,
} = require("../handlersFactory");
const ApiFeatures = require("../../utils/apiFeatures");
const {
  uploadMultipleImages,
} = require("../../middlewares/uploadImageMiddleware");
const { userPropertysPrivate } = require("../../utils/propertysPrivate");

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
exports.getUsers = getAll(userModel, `User`);

// @desc Get user by id
// @route GET /api/v1/users/:id
// @access Private admine
exports.getUser = asyncHandler(async (req, res, next) => {
  const id = req.params.id;
  const document = await userModel.findById(id);
  if (!document) {
    return next(new ApiError(`No user for this id ${id}`, 404));
  };
  const user = userPropertysPrivate(document)
  res.status(200).json({
    data: user,
  });
});

// @desc Create user
// @route POST /api/v1/users
// @access Private admine
exports.createUser = createOne(userModel);

// @desc Update user by id
// @route PUT /api/v1/users/:id
// @access Private admine
exports.updateUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const userCheck = await userModel.findById(id);
  // Check user exist
  if (!userCheck) {
    return next(new ApiError(`No user for this id ${id}`, 404));
  }
  // Check if the user is an admin
  if (userCheck.role === "admin") {
    return next(
      new ApiError(`This user cannot be updated because is an asmin`, 404)
    );
  }
  const document = await userModel.findByIdAndUpdate(
    id,
    {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      slug: req.body.slug,
      email: req.body.email,
      emailVerify: req.body.emailVerify,
      phone: req.body.phone,
      profileImage: req.body.profileImage,
      profileCoverImage: req.body.profileCoverImage,
      role: req.body.role,
    },
    {
      new: true,
    }
  );
  const user = userPropertysPrivate(document);
  res.status(200).json({ data: user });
});

// @desc Change user password
// @route PUT /api/v1/users/changepassword/:id
// @access Private admine
exports.changeUserPassword = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const userCheck = await userModel.findById(id);
  // Check user exist
  if (!userCheck) {
    return next(new ApiError(`No user for this id ${id}`, 404));
  };
  const isCorrectPassword = await bcrypt.compare(
    req.body.currentPassword,
    userCheck.password
  );
  if (!isCorrectPassword) {
    return next(new ApiError("Incorrect current password", 401));
  };
  // Check if the user is an admin
  if (userCheck.role === "admin") {
    return next(
      new ApiError(`This user cannot be change password because is an admin`, 404)
    );
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
  res.status(200).json({ data: user });
});

// @desc Block specific user
// @route PUT /api/v1/users/userblock/:id
// @access Private admine
exports.userBlock = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const userCheck = await userModel.findById(id);
  // Check user exist
  if (!userCheck) {
    return next(new ApiError(`No user for this id ${id}`, 404));
  }
  // Check if the user is an admin
  if (userCheck.role === "admin") {
    return next(
      new ApiError(`This user cannot be blocked because is an admin`, 404)
    );
  };
  const document = await userModel.findByIdAndUpdate(
    id,
    {
      userBlock: req.body.userBlock,
    },
    {
      new: true,
    }
  );
  const user = userPropertysPrivate(document);
  res.status(200).json({ data: user });
});

// @desc Delete user by id
// @route DELETE /api/v1/users/:id
// @access Private admine
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const userCheck = await userModel.findById(id);
  // Check user exist
  if (!userCheck) {
    return next(new ApiError(`No user for this id ${id}`, 404));
  };
  // Check if the user is an admin
  if (userCheck.role === "admin") {
    return next(
      new ApiError(`This user cannot be deleted because is an admin`, 404)
    );
  };
  const user = await userModel.findByIdAndDelete({ _id: id });
  res.status(200).json({ data: user });
});