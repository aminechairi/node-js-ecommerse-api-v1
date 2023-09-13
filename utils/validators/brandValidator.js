const { check } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const slugify = require("slugify");

exports.getBrandValidator = [
  check(`id`)
    .isMongoId()
    .withMessage(`Invalid brand id format`),
  validatorMiddleware,
];

exports.createBrandValidator = [
  check("name")
    .notEmpty()
    .withMessage("Brand required")
    .isLength({ min: 2 })
    .withMessage("Too short brand name")
    .isLength({ max: 32 })
    .withMessage("Too long brand name")
    .custom((value, { req }) => {
      req.body.slug = slugify(value);
      return true;
    }),
  validatorMiddleware,
];

exports.updateBrandValidator = [
  check(`id`)
    .isMongoId()
    .withMessage(`Invalid brand id format`),

  check("name")
    .optional()
    .isLength({ min: 2 })
    .withMessage("Too short brand name")
    .isLength({ max: 32 })
    .withMessage("Too long brand name")
    .custom((value, { req }) => {
      req.body.slug = slugify(value);
      return true;
    }),
  validatorMiddleware,
];

exports.deleteBrandValidator = [
  check(`id`)
    .isMongoId()
    .withMessage(`Invalid brand id format`),
  validatorMiddleware,
];