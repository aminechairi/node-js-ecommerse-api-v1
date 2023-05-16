const express = require('express');
const {
  getSubCategoryValidator,
  createSubCategoryValidator,
  updateSubCategoryValidator,
  deleteSubCategoryValidator,
} = require("../utils/validators/subCategoryValidator");
const { 
  getSubCategories,
  getSubCategory,
  setCategoryIdToBody,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
} = require('../services/subCategoryService');

const router = express.Router({ mergeParams: true });

router.route("/")
.get(getSubCategories)
.post(setCategoryIdToBody, createSubCategoryValidator, createSubCategory);

router.route("/:id")
.get(getSubCategoryValidator, getSubCategory)
.put(updateSubCategoryValidator, updateSubCategory)
.delete(deleteSubCategoryValidator, deleteSubCategory);
module.exports = router;