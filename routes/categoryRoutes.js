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
  uploadCategoryImage,
  resizeImage,
} = require(`../services/categoryService`);
const subCategoriesRoute = require("./subCategoryRoutes");

const router = express.Router();

router.use("/:categoryId/subcategories", subCategoriesRoute);

router.route("/")
.get(getCategories)
.post(
  uploadCategoryImage,
  resizeImage,
  createCategoryValidator,
  createCategories
);
router
  .route("/:id")
  .get(getCategoryValidator, getCategory)
  .put(
    uploadCategoryImage,
    resizeImage,
    updateCategoryValidator,
    updateCategory
  )
  .delete(deleteCategoryValidator, deleteCategory);

module.exports = router;