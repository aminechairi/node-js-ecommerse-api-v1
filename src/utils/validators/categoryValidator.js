const { check } = require('express-validator');
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const slugify = require("slugify");

const categoryModel = require("../../models/categoryModel");

exports.getCategoryValidator = [
  check("id")
  .isMongoId()
  .withMessage("Invalid category ID format."),

  validatorMiddleware,
];

exports.createCategoryValidator = [
  check("name")
    .notEmpty()
    .withMessage("Category name is required.")
    .isString()
    .withMessage("Category name must be of type string.")
    .isLength({ min: 2 })
    .withMessage("Category name must be at least 2 characters.")
    .isLength({ max: 32 })
    .withMessage("Category name cannot exceed 32 characters.")
    .custom(async (value, { req }) => {
      req.body.slug = slugify(value);
      const category = await categoryModel.findOne({ name: value });
      if (category) {
        throw new Error(`This category name already used.`);
      };
      return true;
    }),

  check("image")
    .custom((_, { req }) => {
      if (!(req.body.image === undefined)) {
        throw new Error('The field you entered for Image is not an Image type.');
      };
      return true;
    }),

  validatorMiddleware,
];

exports.updateCategoryValidator = [
  check(`id`)
    .isMongoId()
    .withMessage(`Invalid category ID format.`)
    .custom(async (id) => {
      const category = await categoryModel.findById(id);
      if (!category) throw new Error(`No category for this ID ${id}.`);
    }),

  check("name")
    .optional()
    .isString()
    .withMessage("Category name must be of type string.")
    .isLength({ min: 2 })
    .withMessage("Category name must be at least 2 characters.")
    .isLength({ max: 32 })
    .withMessage("Category name cannot exceed 32 characters.")
    .custom(async (value, { req }) => {
      req.body.slug = slugify(value);
      const category = await categoryModel.findOne({ name: value });
      if (category) {
        throw new Error(`This category name already used.`);
      };
      return true;
    }),

  check("image")
    .custom((_, { req }) => {
      if (!(req.body.image === undefined)) {
        throw new Error('The field you entered for Image is not an Image type.');
      };
      return true;
    }),

  validatorMiddleware,
];

exports.deleteCategoryValidator = [
  check("id")
  .isMongoId()
  .withMessage("Invalid category ID format."),

  validatorMiddleware,
];

exports.imageValidator = [
  check("image")
    .notEmpty()
    .withMessage("Category image is required."),

  validatorMiddleware,
];