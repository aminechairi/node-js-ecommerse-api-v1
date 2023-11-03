const express = require('express');

const {
  getUnderSubCategoriesValidator,
  getUnderSubCategoryValidator,
  createUnderSubCategoryValidator,
  updateUnderSubCategoryValidator,
  deleteUnderSubCategoryValidator,
  imageValidator
} = require("../utils/validators/underSubCategoryValidator");
const {
  createFilterObj,
  getUnderSubCategories,
  getUnderSubCategory,
  setSubCategoryIdToBody,
  createUnderSubCategory,
  updateUnderSubCategory,
  deleteUnderSubCategory,
  uploadUnderSubCategoryImage,
  resizeImage,
} = require("../services/underSubCategoryService");
const protect_allowedTo = require("../services/authServises/protect&allowedTo");

const router = express.Router({ mergeParams: true });

router
  .route("/")
  .get(
    getUnderSubCategoriesValidator,
    createFilterObj,
    getUnderSubCategories,
  ).post(
    protect_allowedTo.protect(),
    protect_allowedTo.allowedTo("admin", "manager"),
    uploadUnderSubCategoryImage,
    setSubCategoryIdToBody,
    createUnderSubCategoryValidator,
    resizeImage,
    imageValidator,
    createUnderSubCategory,
  );

router
  .route("/:id")
  .get(
    getUnderSubCategoryValidator,
    getUnderSubCategory
  ).put(
    protect_allowedTo.protect(),
    protect_allowedTo.allowedTo("admin", "manager"),
    uploadUnderSubCategoryImage,
    updateUnderSubCategoryValidator,
    resizeImage,
    updateUnderSubCategory,
  )
  .delete(
    protect_allowedTo.protect(),
    protect_allowedTo.allowedTo("admin"),
    deleteUnderSubCategoryValidator,
    deleteUnderSubCategory,
  );

module.exports = router;