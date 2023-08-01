const express = require('express');

const authService = require("../services/authService");
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

const router = express.Router({ mergeParams: true });

router
  .route("/")
  .get(
    getSubCategoriesValidator,
    createFilterObj,
    getSubCategories
  ).post(
    authService.protect,
    authService.allowedTo("admin", "manager"),
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
    authService.allowedTo("admin", "manager"),
    updateSubCategoryValidator,
    updateSubCategory
  )
  .delete(
    authService.protect,
    authService.allowedTo("admin"),
    deleteSubCategoryValidator,
    deleteSubCategory
  );

module.exports = router;