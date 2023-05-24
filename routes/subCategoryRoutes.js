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

const router = express.Router({ mergeParams: true });

router.route("/")
.get(getSubCategoriesValidator, createFilterObj, getSubCategories)
.post(setCategoryIdToBody, createSubCategoryValidator, createSubCategory);

router.route("/:id")
.get(getSubCategoryValidator, getSubCategory)
.put(updateSubCategoryValidator, updateSubCategory)
.delete(deleteSubCategoryValidator, deleteSubCategory);
module.exports = router;