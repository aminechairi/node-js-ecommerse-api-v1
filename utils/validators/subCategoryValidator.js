const { check } = require('express-validator');
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const slugify = require("slugify");

const categoryModel = require("../../models/categoryModel");

exports.getSubCategoryValidator = [
  check("id")
    .isMongoId()
    .withMessage("Invalid sub category id format."),

  validatorMiddleware,
];

exports.getSubCategoriesValidator = [
  check("categoryId")
    .optional()
    .isMongoId()
    .withMessage("Invalid category id format"),

  validatorMiddleware,
];

exports.createSubCategoryValidator = [
  check("name")
    .notEmpty()
    .withMessage("Sub category name is required.")
    .isString()
    .withMessage("Sub category name must be of type string.")
    .isLength({ min: 2 })
    .withMessage("Too short sub category name.")
    .isLength({ max: 32 })
    .withMessage("Too long sub category name.")
    .custom((value, { req }) => {
      req.body.slug = `${slugify(value)}`.toLowerCase();
      return true;
    }),

  check("category")
    .notEmpty()
    .withMessage("Sub category must be beloong to category.")
    .isMongoId()
    .withMessage("Invalid category id format.")
    .custom(async (value, { req }) => {
      const ObjectId = req.body.category;
      const category = await categoryModel.findById(ObjectId);
      if (category) {
        return true;
      } else {
        throw new Error(`No category for this id ${ObjectId}`);
      }
    }),

  check("image")
    .notEmpty()
    .withMessage("Sub category image is required.")
    .isString()
    .withMessage("Sub category image must be of type string."),

  validatorMiddleware,
];

exports.updateSubCategoryValidator = [
  check("id")
    .isMongoId()
    .withMessage("Invalid sub category id format."),

  check("name")
    .optional()
    .isString()
    .withMessage("Sub category name must be of type string.")
    .isLength({ min: 2 })
    .withMessage("Too short sub category name.")
    .isLength({ max: 32 })
    .withMessage("Too long sub category name.")
    .custom((value, { req }) => {
      req.body.slug = `${slugify(value)}`.toLowerCase();
      return true;
    }),

  check("category")
    .optional()
    .isMongoId()
    .withMessage("Invalid category id format.")
    .custom(async (value, { req }) => {
      const ObjectId = req.body.category;
      const category = await categoryModel.findById(ObjectId);
      if (category) {
        return true;
      } else {
        throw new Error(`No category for this id ${ObjectId}`);
      }
    }),

  check("image")
    .optional()
    .isString()
    .withMessage("Sub category image must be of type string."),

  validatorMiddleware,
];

exports.deleteSubCategoryValidator = [
  check("id")
    .isMongoId()
    .withMessage("Invalid sub category id format."),

  validatorMiddleware,
];