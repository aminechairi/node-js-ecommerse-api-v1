const sharp = require("sharp");
const asyncHandler = require("express-async-handler");
const { v4: uuidv4 } = require("uuid");

const {
  deleteOne,
  updateOne,
  createOne,
  getOne,
  getAll,
} = require("./handlersFactory");
const { uploadSingleImage } = require("../middlewares/uploadImageMiddleware");

const categoryMudel = require(`../models/categoryModel`);

// upload single image
exports.uploadCategoryImage = uploadSingleImage("image");

// image processing
exports.resizeImage = asyncHandler(async (req, res, next) => {
  const fileName = `category-${uuidv4()}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(800, 800)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`uploads/categories/${fileName}`);
  // Save Image to Into Our db
  req.body.image = `${fileName}`;
  next();
});

// @desc Get List Of Categories
// @route GET /api/v1/categories
// @access Public
exports.getCategories = getAll(categoryMudel);

// @desc Get Category by id
// @route GET /api/v1/categories/:id
// @access Public
exports.getCategory = getOne(categoryMudel);

// @desc Create Category
// @route POST /api/v1/categories
// @access private
exports.createCategories = createOne(categoryMudel);

// @desc Update specific Category
// @route PUT /api/v1/categories/:id
// @access private
exports.updateCategory = updateOne(categoryMudel);

// @desc Delete specific category
// @route DELETE /api/v1/categories/:id
// @access private
exports.deleteCategory = deleteOne(categoryMudel);
