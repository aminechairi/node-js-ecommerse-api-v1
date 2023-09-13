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
const subCategoryModel = require("../models/subCategoryModel");

// Upload single image
exports.uploadSubCategoryImage = uploadSingleImage("image");

// Image processing
exports.resizeImage = asyncHandler(async (req, res, next) => {
  const fileName = `subCategory-${uuidv4()}-${Date.now()}.jpeg`;
  if (req.file) {
    await sharp(req.file.buffer)
      .resize(800, 800)
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toFile(`uploads/subCategories/${fileName}`);
    // Save image to Into Our db
    req.body.image = `${fileName}`;
  }
  next();
});

// Nested route
// GET /api/v1/categories/:categoryId/subcategories
exports.createFilterObj = (req, res, next) => {
  let filterObject = {};
  if (req.params.categoryId) filterObject = { category: req.params.categoryId };
  req.filterObj = filterObject;
  next();
};

// @desc Get list Of subCategories
// @route GET /api/v1/subcategories
// @access Public
exports.getSubCategories = getAll(subCategoryModel);

// @desc Get subCategory by id
// @route GET /api/v1/subcategories/:id
// @access Public
exports.getSubCategory = getOne(subCategoryModel);

exports.setCategoryIdToBody = (req, res, next) => {
  // Nested route (Create)
  if (!req.body.category) req.body.category = req.params.categoryId;
  next();
};

// @desc Create subCategory
// @route POST /api/v1/subcategories
// @access Private
exports.createSubCategory = createOne(subCategoryModel);

// @desc Update subCategory by id
// @route PUT /api/v1/subcategories/:id
// @access Private
exports.updateSubCategory = updateOne(subCategoryModel);

// @desc Delete subcategory by id
// @route DELETE /api/v1/subcategories/:id
// @access Private
exports.deleteSubCategory = deleteOne(subCategoryModel);
