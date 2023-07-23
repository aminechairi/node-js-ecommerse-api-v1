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
const authService = require("../services/authService");

const routes = express.Router();

routes
  .route("/")
  .get(getBrands)
  .post(
    authService.protect,
    authService.allowedTo("manager", "admin"),
    uploadBrandImage,
    resizeImage,
    createBrandValidator,
    createBrand
  );

routes
  .route("/:id")
  .get(
    getBrandValidator,
    getBrand
  ).put(
    authService.protect,
    authService.allowedTo("manager", "admin"),
    uploadBrandImage,
    resizeImage,
    updateBrandValidator,
    updateBrand
  ).delete(
    authService.protect,
    authService.allowedTo("admin"),
    deleteBrandValidator,
    deleteBrand
  );

module.exports = routes;