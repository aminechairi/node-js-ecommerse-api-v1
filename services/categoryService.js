const {
  resizeImage,
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
exports.resizeImage = resizeImage(['categories', 'category'], 800, 800);

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
exports.updateCategory = updateOne(categoryModel);

// @desc Delete category by id
// @route DELETE /api/v1/categories/:id
// @access Private
exports.deleteCategory = deleteOne(categoryModel, true);