const express = require(`express`);

const {
  getBrandValidator,
  createBrandValidator,
  updateBrandValidator,
  deleteBrandValidator,
} = require("../utils/validators/brandValidator")
const {
  getBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand,
  uploadBrandImage,
  resizeImage,
} = require("../services/brandService");
const protect_allowedTo = require("../services/authServises/protect&allowedTo");

const router = express.Router();

router
  .route("/")
  .get(
    getBrands
  ).post(
    protect_allowedTo.protect(),
    protect_allowedTo.allowedTo("admin", "manager"),
    uploadBrandImage,
    resizeImage,
    createBrandValidator,
    createBrand
  );

router
  .route("/:id")
  .get(
    getBrandValidator,
    getBrand
  ).put(
    protect_allowedTo.protect(),
    protect_allowedTo.allowedTo("admin", "manager"),
    uploadBrandImage,
    resizeImage,
    updateBrandValidator,
    updateBrand
  ).delete(
    protect_allowedTo.protect(),
    protect_allowedTo.allowedTo("admin"),
    deleteBrandValidator,
    deleteBrand
  );

module.exports = router;