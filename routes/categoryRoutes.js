const express = require(`express`);
const {
  getCategotyValidator,
  createCategoryValidator, 
  updateCategotyValidator,
  deleteCategotyValidator
} = require("../utils/validators/categoryValidator");

const { 
  getCategories,
  getCategory,
  createCategories,
  updateCategory,
  deleteCategory,
} = require(`../services/categoryService`);

const router = express.Router();

router.route("/")
.get(getCategories)
.post(createCategoryValidator, createCategories);
router.route("/:id")
.get(getCategotyValidator, getCategory)
.put(updateCategotyValidator, updateCategory)
.delete(deleteCategotyValidator, deleteCategory);

module.exports = router;