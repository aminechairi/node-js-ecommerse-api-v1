const { check } = require('express-validator');
const validatorMiddleware = require("../../middlewares/validatorMiddleware");

exports.getCategotyValidator = [
  check(`id`).isMongoId().withMessage(`Invalid category id format`),
  validatorMiddleware,
];

exports.createCategoryValidator = [
  check("name")
  .notEmpty()
  .withMessage("Category required")
  .isLength({ min: 3 })
  .withMessage("Too short category name")
  .isLength({ max: 32 })
  .withMessage("Too long category name"),
  validatorMiddleware,
];

exports.updateCategotyValidator = [
  check(`id`)
  .isMongoId()
  .withMessage(`Invalid category id format`),
  check("name")
  .notEmpty()
  .withMessage("Category required")
  .isLength({ min: 3 })
  .withMessage("Too short category name")
  .isLength({ max: 32 })
  .withMessage("Too long category name"),
  validatorMiddleware,
];

exports.deleteCategotyValidator = [
  check(`id`)
  .isMongoId()
  .withMessage(`Invalid category id format`),
  validatorMiddleware,
];