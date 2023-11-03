const fs = require('fs');
const path = require("path");

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
    return next(new ApiError(`No user for this id ${id}.`, 404));
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
  const body = req.body;

  const userCheck = await userModel.findById(id);
  // Check user exist
  if (!userCheck) {
    return next(new ApiError(`No user for this id ${id}.`, 404));
  }
  // Check if the user is an admin
  if (userCheck.role === "admin") {
    return next(
      new ApiError(`This user cannot be updated data because is an admin.`, 404)
    );
  };

  if (body.profileImage || body.profileCoverImage) {

    let user = await userModel.findByIdAndUpdate(
      id,
      {
        firstName: body.firstName,
        lastName: body.lastName,
        slug: body.slug,
        email: body.email,
        emailVerify: body.emailVerify,
        phone: body.phone,
        profileImage: body.profileImage,
        profileCoverImage: body.profileCoverImage,
        role: body.role,
      }
    );

    let allUrlsImages = [];
    if (body.profileImage) {
      allUrlsImages.push(user.profileImage);
    };
    if (body.profileCoverImage) {
      allUrlsImages.push(user.profileCoverImage);
    };

    const allNamesImages = allUrlsImages.map((item) => {
      const imageUrl = item;
      const baseUrl = `${process.env.BASE_URL}/users/`;
      const imageName = imageUrl.replace(baseUrl, '');
      return imageName;
    });
  
    for (let i = 0; i < allNamesImages.length; i++) {
      const imagePath = path.join(__dirname, '..', '..', 'uploads', 'users', `${allNamesImages[i]}`);
      fs.unlink(imagePath, (err) => {});
    };

    user = await userModel.find({ _id: id });

    user = userPropertysPrivate(user[0]);

    res.status(200).json({ data: user });

  } else {

    let user = await userModel.findByIdAndUpdate(
      id,
      {
        firstName: body.firstName,
        lastName: body.lastName,
        slug: body.slug,
        email: body.email,
        emailVerify: body.emailVerify,
        phone: body.phone,
        role: body.role,
      },
      {
        new: true,
      }
    );

    user = userPropertysPrivate(user);
    res.status(200).json({ data: user });

  };

});

// @desc Change user password
// @route PUT /api/v1/users/changepassword/:id
// @access Private admine
exports.changeUserPassword = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const userCheck = await userModel.findById(id);
  // Check user exist
  if (!userCheck) {
    return next(new ApiError(`No user for this id ${id}.`, 404));
  };
  // Check if the user is an admin
  if (userCheck.role === "admin") {
    return next(
      new ApiError(`This user cannot be change password because is an admin.`, 404)
    );
  };
  const isCorrectPassword = await bcrypt.compare(
    req.body.currentPassword,
    userCheck.password
  );
  if (!isCorrectPassword) {
    return next(new ApiError("Incorrect current password.", 401));
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
    return next(new ApiError(`No user for this id ${id}.`, 404));
  }
  // Check if the user is an admin
  if (userCheck.role === "admin") {
    return next(
      new ApiError(`This user cannot be blocked because is an admin.`, 404)
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
    return next(new ApiError(`No user for this id ${id}.`, 404));
  };
  // Check if the user is an admin
  if (userCheck.role === "admin") {
    return next(
      new ApiError(`This user cannot be deleted because is an admin.`, 404)
    );
  };

  // Delete user
  let user = await userModel.findByIdAndDelete({ _id: id });
  // Delete images
  if (user.profileImage || user.profileCoverImage) {

    let allUrlsImages = [];
    if (user.profileImage) {
      allUrlsImages.push(user.profileImage);
    };
    if (user.profileCoverImage) {
      allUrlsImages.push(user.profileCoverImage);
    };

    const allNamesImages = allUrlsImages.map((item) => {
      const imageUrl = item;
      const baseUrl = `${process.env.BASE_URL}/users/`;
      const imageName = imageUrl.replace(baseUrl, '');
      return imageName;
    });
  
    for (let i = 0; i < allNamesImages.length; i++) {
      const imagePath = path.join(__dirname, '..', '..', 'uploads', 'users', `${allNamesImages[i]}`);
      fs.unlink(imagePath, (err) => {});
    };

    user = userPropertysPrivate(user);

    res.status(200).json({ data: user }); 

  } else {

    user = userPropertysPrivate(user);

    res.status(200).json({ data: user });

  };

});