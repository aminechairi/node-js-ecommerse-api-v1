const express = require('express');

const {
  getSubCategoryValidator,
  getSubCategoriesValidator,
  createSubCategoryValidator,
  updateSubCategoryValidator,
  deleteSubCategoryValidator,
} = require("../utils/validators/subCategoryValidator");
const { 
  getSubCategories,
  getSubCategory,
  setCategoryIdToBody,
  createSubCategory,
  createFilterObj,
  updateSubCategory,
  deleteSubCategory,
} = require('../services/subCategoryService');
const authService = require("../services/authService");

const router = express.Router({ mergeParams: true });

router
  .route("/")
  .get(
    getSubCategoriesValidator,
    createFilterObj,
    getSubCategories
  ).post(
    authService.protect,
    authService.allowedTo("manager", "admin"),
    setCategoryIdToBody,
    createSubCategoryValidator,
    createSubCategory
  );

router
  .route("/:id")
  .get(
    getSubCategoryValidator,
    getSubCategory
  ).put(
    authService.protect,
    authService.allowedTo("manager", "admin"),
    updateSubCategoryValidator,
    updateSubCategory
  ).delete(
    authService.protect,
    authService.allowedTo("admin"),
    deleteSubCategoryValidator,
    deleteSubCategory
  );

module.exports = router;