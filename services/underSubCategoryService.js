const {
  resizeImage,
  deleteOne,
  updateOne,
  createOne,
  getOne,
  getAll,
} = require("./handlersFactory");
const { uploadSingleImage } = require("../middlewares/uploadImageMiddleware");
const underSubCategoryModel = require("../models/underSubCategoryModel");

// Upload single image
exports.uploadUnderSubCategoryImage = uploadSingleImage("image");

// Image processing
exports.resizeImage = resizeImage(['underSubCategories', 'underSubCategory'], 600, 600);

// Nested route
// GET /api/v1/subcategories/:subCategoryId/undersubcategories
exports.createFilterObj = (req, res, next) => {
  let filterObject = {};
  if (req.params.subCategoryId) filterObject = { subCategory: req.params.subCategoryId };
  req.filterObj = filterObject;
  next();
};

// @desc Get list Of underSubCategories
// @route GET /api/v1/undersubcategories
// @access Public
exports.getUnderSubCategories = getAll(underSubCategoryModel);

// @desc Get underSubCategory by id
// @route GET /api/v1/undersubcategories/:id
// @access Public
exports.getUnderSubCategory = getOne(underSubCategoryModel);

exports.setSubCategoryIdToBody = (req, res, next) => {
  // Nested route (Create)
  if (!req.body.subCategory) req.body.subCategory = req.params.subCategoryId;
  next();
};

// @desc Create underSubCategory
// @route POST /api/v1/undersubcategories
// @access Private
exports.createUnderSubCategory = createOne(underSubCategoryModel);

// @desc Update underSubCategory by id
// @route PUT /api/v1/undersubcategories/:id
// @access Private
exports.updateUnderSubCategory = updateOne(underSubCategoryModel);

// @desc Delete underSubCategory by id
// @route DELETE /api/v1/undersubcategories/:id
// @access Private
exports.deleteUnderSubCategory = deleteOne(underSubCategoryModel, true);