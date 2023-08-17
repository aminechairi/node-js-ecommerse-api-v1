const express = require(`express`);

const {
  createProductValidator,
  getProductValidator,
  updateProductValidator,
  deleteProductValidator ,
} = require('../utils/validators/productValidator');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  resizeProductImages,
} = require('../services/productService');
const protect_allowedTo = require("../services/authServises/protect&allowedTo");

const router = express.Router();

router
  .route("/")
  .get(
    getProducts
  ).post(
    protect_allowedTo.protect(),
    protect_allowedTo.allowedTo("admin", "manager"),
    uploadProductImages,
    resizeProductImages,
    createProductValidator,
    createProduct
  );

router
  .route("/:id")
  .get(
    getProductValidator,
    getProduct
  ).put(
    protect_allowedTo.protect(),
    protect_allowedTo.allowedTo("admin", "manager"),
    uploadProductImages,
    resizeProductImages,
    updateProductValidator,
    updateProduct
  )
  .delete(
    protect_allowedTo.protect(),
    protect_allowedTo.allowedTo("admin"),
    deleteProductValidator,
    deleteProduct
  );

module.exports = router;