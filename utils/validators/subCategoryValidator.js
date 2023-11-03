const { check } = require('express-validator');
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const slugify = require("slugify");

const categoryModel = require("../../models/categoryModel");
const subCategoryModel = require('../../models/subCategoryModel')

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
    .custom((_, { req }) => {
      if (!(req.body.image === undefined)) {
        throw new Error('The field you entered for Image is not an Image type.');
      };
      return true;
    }),

  validatorMiddleware,
];

exports.updateSubCategoryValidator = [
  check("id")
    .isMongoId()
    .withMessage("Invalid sub category id format.")
    .custom(async (value, { req }) => {
      const subCategory = await subCategoryModel.findById(value);
      if (!subCategory) {
        throw new Error(`No sub category for this id ${value}.`);
      };
    }),

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

  check("image")
    .custom((_, { req }) => {
      if (!(req.body.image === undefined)) {
        throw new Error('The field you entered for Image is not an Image type.');
      };
      return true;
    }),

  validatorMiddleware,
];

exports.deleteSubCategoryValidator = [
  check("id")
    .isMongoId()
    .withMessage("Invalid sub category id format."),

  validatorMiddleware,
];

exports.imageValidator = [
  check("image")
    .notEmpty()
    .withMessage("Sub category image is required."),

  validatorMiddleware,
];