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
} = require("../services/brandService");

const routes = express.Router();

routes.route("/")
.get(getBrands)
.post(createBrandValidator, crateBrand);

routes.route("/:id")
.get(getBrandValidator, getBrand)
.put(updateBrandValidator, updateBrand)
.delete(deleteBrandValidator, deleteBrand);

module.exports = routes;