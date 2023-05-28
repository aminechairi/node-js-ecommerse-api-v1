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
  crateBrand,
  updateBrand,
  deleteBrand,
  uploadBrandImage,
  resizeImage,
} = require("../services/brandService");

const routes = express.Router();

routes
  .route("/")
  .get(getBrands)
  .post(
    uploadBrandImage,
    resizeImage,
    createBrandValidator,
    crateBrand
  );

routes.route("/:id")
  .get(getBrandValidator, getBrand)
  .put(
    uploadBrandImage,
    resizeImage,
    updateBrandValidator,
    updateBrand
  )
.delete(deleteBrandValidator, deleteBrand);

module.exports = routes;