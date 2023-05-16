const { check } = require('express-validator');
const validatorMiddleware = require("../../middlewares/validatorMiddleware");

exports.getSubCategoryValidator = [
  check("id")
    .isMongoId()
    .withMessage(`Invalid subcategory id format`),
  validatorMiddleware,
];

exports.createSubCategoryValidator = [
  check("name")
    .notEmpty()
    .withMessage("subCategory required")
    .isLength({ min: 2 })
    .withMessage("Too short subcategory name")
    .isLength({ max: 32 })
    .withMessage("Too long subcategory name"),
  check("category")
    .notEmpty()
    .withMessage("subCategory must be beloong to category")
    .isMongoId()
    .withMessage("Invalid category id format"),
  validatorMiddleware,
];

exports.updateSubCategoryValidator = [
  check("id")
  .isMongoId()
  .withMessage(`Invalid subcategory id format`),
  check("name")
    .notEmpty()
    .withMessage("subCategory required")
    .isLength({ min: 2 })
    .withMessage("Too short subcategory name")
    .isLength({ max: 32 })
    .withMessage("Too long subcategory name"),
  // check("category")
  //   .notEmpty()
  //   .withMessage("subCategory must be beloong to category")
  //   .isMongoId()
  //   .withMessage("Invalid category id format"),
  validatorMiddleware,
];

exports.deleteSubCategoryValidator = [
  check("id")
    .isMongoId()
    .withMessage(`Invalid subcategory id format`),
  validatorMiddleware,
];