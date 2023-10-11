const { check } = require('express-validator');
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const slugify = require("slugify");

const categoryModel = require("../../models/categoryModel");

exports.getCategoryValidator = [
  check("id")
  .isMongoId()
  .withMessage("Invalid category id format."),

  validatorMiddleware,
];

exports.createCategoryValidator = [
  check("name")
    .notEmpty()
    .withMessage("Category name is required.")
    .isString()
    .withMessage("Category name must be of type string.")
    .isLength({ min: 3 })
    .withMessage("Too short category name.")
    .isLength({ max: 32 })
    .withMessage("Too long category name.")
    .custom(async (value, { req }) => {
      req.body.slug = slugify(value);
      const category = await categoryModel.findOne({ name: value });
      if (category) {
        throw new Error(`I've used this name before.`);
      };
      return true;
    }),

  check("image")
    .notEmpty()
    .withMessage("Category image is required.")
    .isString()
    .withMessage("Category image must be of type string."),

  validatorMiddleware,
];

exports.updateCategoryValidator = [
  check(`id`)
    .isMongoId()
    .withMessage(`Invalid category id format.`),

  check("name")
    .optional()
    .isString()
    .withMessage("Category name must be of type string.")
    .isLength({ min: 3 })
    .withMessage("Too short category name.")
    .isLength({ max: 32 })
    .withMessage("Too long category name.")
    .custom(async (value, { req }) => {
      req.body.slug = slugify(value);
      const category = await categoryModel.findOne({ name: value });
      if (category) {
        throw new Error(`I've used this name before.`);
      };
      return true;
    }),

  check("image")
    .optional()
    .isString()
    .withMessage("Category image must be of type string."),

  validatorMiddleware,
];

exports.deleteCategoryValidator = [
  check("id")
  .isMongoId()
  .withMessage("Invalid category id format."),
  validatorMiddleware,
];