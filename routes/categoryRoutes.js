const express = require(`express`);
const {
  getCategoryValidator,
  createCategoryValidator, 
  updateCategoryValidator,
  deleteCategoryValidator
} = require("../utils/validators/categoryValidator");

const { 
  getCategories,
  getCategory,
  createCategories,
  updateCategory,
  deleteCategory,
} = require(`../services/categoryService`);
const subCategoriesRoute = require("./subCategoryRoutes");

const router = express.Router();

router.use("/:categoryId/subcategories", subCategoriesRoute);

router.route("/")
.get(getCategories)
.post(createCategoryValidator, createCategories);
router.route("/:id")
.get(getCategoryValidator, getCategory)
.put(updateCategoryValidator, updateCategory)
.delete(deleteCategoryValidator, deleteCategory);

module.exports = router;