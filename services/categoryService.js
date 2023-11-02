const sharp = require("sharp");
const asyncHandler = require("express-async-handler");
const { v4: uuidv4 } = require("uuid");

const ApiError = require('../utils/apiErrore');
const {
  deleteOne,
  updateOne,
  createOne,
  getOne,
  getAll,
} = require("./handlersFactory");
const { uploadSingleImage } = require("../middlewares/uploadImageMiddleware");
const categoryModel = require(`../models/categoryModel`);

// Upload single image
exports.uploadCategoryImage = uploadSingleImage("image");

// Image processing
exports.resizeImage = asyncHandler(async (req, res, next) => {
  const fileName = `category-${uuidv4()}-${Date.now()}.jpeg`;
  if (req.file) {
    await sharp(req.file.buffer)
      .resize(800, 800)
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toFile(`uploads/categories/${fileName}`);
    // Save image to Into Our db
    req.body.image = `${fileName}`;
  }
  next();
});

// @desc Get list of categories
// @route GET /api/v1/categories
// @access Public
exports.getCategories = getAll(categoryModel);

// @desc Get category by id
// @route GET /api/v1/categories/:id
// @access Public
exports.getCategory = getOne(categoryModel);

// @desc Create category
// @route POST /api/v1/categories
// @access Private 
exports.createCategories = createOne(categoryModel);

// @desc Update category by id
// @route PUT /api/v1/categories/:id
// @access Private
exports.updateCategory = updateOne(categoryModel, 'categories');

// @desc Delete category by id
// @route DELETE /api/v1/categories/:id
// @access Private
exports.deleteCategory = deleteOne(categoryModel, 'categories');