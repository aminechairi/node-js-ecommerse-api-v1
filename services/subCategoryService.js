const { 
  deleteOne,
  updateOne,
  createOne,
  getOne,
  getAll,
} = require("./handlersFactory");
const subCategoryModel = require("../models/subCategoryModel");

exports.setCategoryIdToBody = (req, res, next) => {
  // Nested route (Create)
  if (!req.body.category) req.body.category = req.params.categoryId;
  next();
};

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

// @desc Create subCategory
// @route POST /api/v1/subcategories
// @access Private admine & manager
exports.createSubCategory = createOne(subCategoryModel);

// @desc Update specific subCategory
// @route PUT /api/v1/subcategories/:id
// @access Private admine & manager
exports.updateSubCategory = updateOne(subCategoryModel);

// @desc Delete specific subcategory
// @route DELETE /api/v1/subcategories/:id
// @access Private admine
exports.deleteSubCategory = deleteOne(subCategoryModel);