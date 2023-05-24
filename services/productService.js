const { 
  deleteOne,
  updateOne,
  createOne,
  getOne,
  getAll,
} = require("./handlersFactory");

const productMudel = require("../models/productModel");

// @desc Get List Of Products
// @route GET /api/v1/products
// @access Public
exports.getProducts = getAll(productMudel, `Product`);

// @desc Get Product by id
// @route GET /api/v1/products/:id
// @access Public
exports.getProduct = getOne(productMudel);

// @desc Create Product
// @route POST /api/v1/products
// @access private
exports.createProduct = createOne(productMudel);

// @desc Update specific Product
// @route PUT /api/v1/products/:id
// @access private
exports.updateProduct = updateOne(productMudel);

// @desc Delete specific Product
// @route DELETE /api/v1/products/:id
// @access private
exports.deleteProduct = deleteOne(productMudel);