const { check } = require('express-validator');
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const slugify = require("slugify");

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
    .custom((value, { req }) => {
      req.body.slug = slugify(value);
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
    .custom((value, { req }) => {
      req.body.slug = slugify(value);
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