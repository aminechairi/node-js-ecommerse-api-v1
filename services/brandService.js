const {
  resizeImage,
  deleteOne,
  updateOne,
  createOne,
  getOne,
  getAll,
} = require("./handlersFactory");
const { uploadSingleImage } = require("../middlewares/uploadImageMiddleware");
const brandModel = require("../models/brandModel");

// Upload single image
exports.uploadBrandImage = uploadSingleImage("image");

// Image processing
exports.resizeImage = resizeImage('brands', 'brand');

// @desc Get List of brands
// @route GET /api/v1/brands
// @access Public 
exports.getBrands = getAll(brandModel);

// @desc Get brand by id
// @route GET /api/v1/brands/:id
// @access Public
exports.getBrand = getOne(brandModel);

// @desc Create brand
// @route POST /api/v1/brand
// @access Private
exports.createBrand = createOne(brandModel);

// @desc Update Brand by id
// @route PUT /api/v1/brands/:id
// @access Private
exports.updateBrand = updateOne(brandModel);

// @desc Delete brand by id
// @route DELETE /api/v1/brand/:id
// @access Private
exports.deleteBrand = deleteOne(brandModel, true);