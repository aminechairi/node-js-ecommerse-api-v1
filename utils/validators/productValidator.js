const { check } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const slugify = require("slugify");

const categoryModel = require(`../../models/categoryModel`);
const subCategoryModel = require("../../models/subCategoryModel");
const brandModel = require("../../models/brandModel");

exports.createProductValidator = [
  check("title")
    .isString()
    .withMessage("title prodact should be a string")
    .notEmpty()
    .withMessage("title prodact required")
    .isLength({ min: 3 })
    .withMessage("must be at least 3 chars")
    .custom((value, { req }) => {
      req.body.slug = slugify(value);
      return true;
    }),

  check("description")
    .notEmpty()
    .withMessage("Product description is required")
    .isLength({ max: 2000 })
    .withMessage("Too long description"),

  check("quantity")
    .notEmpty()
    .withMessage("Product quantity is required")
    .isNumeric()
    .withMessage("Product quantity must be a number"),

  check("sold")
    .optional()
    .isNumeric()
    .withMessage("Product quantity must be a number"),

  check("price")
    .notEmpty()
    .withMessage("Product price is required")
    .isNumeric()
    .withMessage("Product price must be a number")
    .isLength({ max: 32 })
    .withMessage("To long price"),

  check("priceAfterDiscount")
    .optional()
    .isNumeric()
    .withMessage("Product priceAfterDiscount must be a number")
    .toFloat()
    .custom((value, { req }) => {
      if (req.body.price <= value) {
        throw new Error("priceAfterDiscount must be lower than price");
      }
      return true;
    }),

  check("colors")
    .optional()
    .isArray()
    .withMessage("availableColors should be array of string"),

  check("imageCover").notEmpty().withMessage("Product imageCover is required"),

  check("images")
    .optional()
    .isArray()
    .withMessage("images should be array of string"),

  check("category")
    .notEmpty()
    .withMessage("Product must be belong to a category")
    .isMongoId()
    .withMessage("Invalid ID formate")
    .custom(async (value, { req }) => {
      const ObjectId = req.body.category;
      const category = await categoryModel.findById(ObjectId);
      if (category) {
        return true;
      } else {
        throw new Error(`No category for this id ${ObjectId}`);
      }
    }),

  check("subcategories")
    .optional()
    .isMongoId()
    .withMessage("Invalid ID formate")
    .custom(async (subcategoriesIds) => {
      if (subcategoriesIds.length > 0) {
        const subcategories = await subCategoryModel.find({
          _id: { $in: subcategoriesIds },
        });
        if (subcategories.length !== subcategoriesIds.length) {
          throw new Error(
            `Invalid subCategories ${
              subcategoriesIds.length === 1 ? `id` : `ids`
            } ${subcategoriesIds}`
          );
        } else {
          return true;
        }
      } else {
        return true;
      }
    })
    .custom(async (subcategoriesIds, { req }) => {
      // step 1
      const subcategories = await subCategoryModel.find({
        category: req.body.category,
      });

      // step 2
      const listSubcategoriesIds = [];
      for (let i = 0; i < subcategories.length; i++) {
        listSubcategoriesIds.push(subcategories[i]._id.toString());
      }
      // step 3
      const check = subcategoriesIds.every((el) => {
        return listSubcategoriesIds.includes(el);
      });
      // step 4
      if (!check) {
        throw new Error(`subCategories not belong to categories`);
      }
      return true;
    }),

  check("brand")
    .optional()
    .isMongoId()
    .withMessage("Invalid ID formate")
    .custom(async (value, { req }) => {
      const ObjectId = req.body.brand;
      const brand = await brandModel.findById(ObjectId);
      if (brand) {
        return true;
      } else {
        throw new Error(`No brand for this id ${ObjectId}`);
      }
    }),

  check("ratingsAverage")
    .optional()
    .isNumeric()
    .withMessage("ratingsAverage must be a number")
    .isLength({ min: 1 })
    .withMessage("Rating must be above or equal 1.0")
    .isLength({ max: 5 })
    .withMessage("Rating must be below or equal 5.0"),

  check("ratingsQuantity")
    .optional()
    .isNumeric()
    .withMessage("ratingsQuantity must be a number"),

  validatorMiddleware,
];

exports.getProductValidator = [
  check("id")
    .isMongoId()
    .withMessage("Invalid ID formate"),
  validatorMiddleware,
];

exports.updateProductValidator = [
  check("id")
    .isMongoId()
    .withMessage("Invalid ID formate"),
  check("title").custom((value, { req }) => {
    if (value) {
      req.body.slug = slugify(value);
    }
    return true;
  }),

  check("category")
    .optional()
    .isMongoId()
    .withMessage("Invalid ID formate")
    .custom(async (value, { req }) => {
      const ObjectId = req.body.category;
      const category = await categoryModel.findById(ObjectId);
      if (category) {
        return true;
      } else {
        throw new Error(`No category for this id ${ObjectId}`);
      }
    }),

  check("subcategories")
    .optional()
    .isMongoId()
    .withMessage("Invalid ID formate")
    .custom(async (subcategoriesIds) => {
      if (subcategoriesIds.length > 0) {
        const subcategories = await subCategoryModel.find({
          _id: { $in: subcategoriesIds },
        });
        if (subcategories.length !== subcategoriesIds.length) {
          throw new Error(
            `Invalid subCategories ${
              subcategoriesIds.length === 1 ? `id` : `ids`
            } ${subcategoriesIds}`
          );
        } else {
          return true;
        }
      } else {
        return true;
      }
    })
    .custom(async (subcategoriesIds, { req }) => {
      // step 1
      const subcategories = await subCategoryModel.find({
        category: req.body.category,
      });

      // step 2
      const listSubcategoriesIds = [];
      for (let i = 0; i < subcategories.length; i++) {
        listSubcategoriesIds.push(subcategories[i]._id.toString());
      }
      // step 3
      const check = subcategoriesIds.every((el) => {
        return listSubcategoriesIds.includes(el);
      });
      // step 4
      if (!check) {
        throw new Error(`subCategories not belong to categories`);
      }
      return true;
    }),

  check("brand")
    .optional()
    .isMongoId()
    .withMessage("Invalid ID formate")
    .custom(async (value, { req }) => {
      const ObjectId = req.body.brand;
      const brand = await brandModel.findById(ObjectId);
      if (brand) {
        return true;
      } else {
        throw new Error(`No brand for this id ${ObjectId}`);
      }
    }),

  validatorMiddleware,
];

exports.deleteProductValidator = [
  check("id")
    .isMongoId()
    .withMessage("Invalid ID formate"),
  validatorMiddleware,
];