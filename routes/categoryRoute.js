const express = require(`express`);

const authService = require("../services/authService");
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
const subCategoriesRoute = require("./subCategoryRoute");

const router = express.Router();

router.use(
    "/:categoryId/subcategories",
    subCategoriesRoute
  );

router.route("/")
  .get(
    getCategories
  ).post(
    authService.protect,
    authService.allowedTo("admin", "manager"),
    uploadCategoryImage,
    resizeImage,
    createCategoryValidator,
    createCategories
  );

router
  .route("/:id")
  .get(getCategoryValidator, getCategory)
  .put(
    authService.protect,
    authService.allowedTo("admin", "manager"),
    uploadCategoryImage,
    resizeImage,
    updateCategoryValidator,
    updateCategory
  )
  .delete(
    authService.protect,
    authService.allowedTo("admin"),
    deleteCategoryValidator,
    deleteCategory
  );

module.exports = router;