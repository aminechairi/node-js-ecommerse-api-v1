const { check } = require('express-validator');
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const slugify = require("slugify");

const subCategoryModel = require('../../models/subCategoryModel');
const underSubCategoryModel = require('../../models/underSubCategoryModel');

exports.getUnderSubCategoriesValidator = [
  check("subCategoryId")
    .optional()
    .isMongoId()
    .withMessage("Invalid sub category id format"),

  validatorMiddleware,
];

exports.getUnderSubCategoryValidator = [
  check("id")
    .isMongoId()
    .withMessage("Invalid under sub category id format."),

  validatorMiddleware,
];

exports.createUnderSubCategoryValidator = [
  check("name")
    .notEmpty()
    .withMessage("Under sub category name is required.")
    .isString()
    .withMessage("Under sub category name must be of type string.")
    .isLength({ min: 2 })
    .withMessage("Too short under sub category name.")
    .isLength({ max: 32 })
    .withMessage("Too long under sub category name.")
    .custom((value, { req }) => {
      req.body.slug = `${slugify(value)}`.toLowerCase();
      return true;
    }),

  check("subCategory")
    .notEmpty()
    .withMessage("Under sub category must be beloong to sub category.")
    .isMongoId()
    .withMessage("Invalid sub category id format.")
    .custom(async (value, { req }) => {
      const ObjectId = req.body.subCategory;
      const subCategory = await subCategoryModel.findById(ObjectId);
      if (subCategory) {
        return true;
      } else {
        throw new Error(`No sub category for this id ${ObjectId}`);
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

exports.updateUnderSubCategoryValidator = [
  check("id")
    .isMongoId()
    .withMessage("Invalid under sub category id format.")
    .custom(async (value, { req }) => {
      const underSubCategory = await underSubCategoryModel.findById(value);
      if (!underSubCategory) {
        throw new Error(`No under sub category for this id ${value}.`);
      };
    }),

  check("name")
    .optional()
    .isString()
    .withMessage("Under sub category name must be of type string.")
    .isLength({ min: 2 })
    .withMessage("Too short under sub category name.")
    .isLength({ max: 32 })
    .withMessage("Too long under sub category name.")
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

exports.deleteUnderSubCategoryValidator = [
  check("id")
    .isMongoId()
    .withMessage("Invalid under sub category id format."),

  validatorMiddleware,
];

exports.imageValidator = [
  check("image")
    .notEmpty()
    .withMessage("Under sub category image is required."),

  validatorMiddleware,
];