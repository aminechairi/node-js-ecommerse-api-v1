const { check } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const slugify = require("slugify");

const brandModel = require("../../models/brandModel");

exports.getBrandValidator = [
  check("id")
    .isMongoId()
    .withMessage("Invalid brand id format."),

  validatorMiddleware,
];

exports.createBrandValidator = [
  check("name")
    .notEmpty()
    .withMessage("Brand name is required.")
    .isString()
    .withMessage("Brand name must be of type string.")
    .isLength({ min: 3 })
    .withMessage("Too short brand name.")
    .isLength({ max: 32 })
    .withMessage("Too long brand name.")
    .custom(async (value, { req }) => {
      req.body.slug = slugify(value);
      const brand = await brandModel.findOne({ name: value });
      if (brand) {
        throw new Error(`I've used this name before.`);
      };
      return true;
    }),

  check("image")
    .notEmpty()
    .withMessage("Brand image is required.")
    .isString()
    .withMessage("Brand image must be of type string."),

  validatorMiddleware,
];

exports.updateBrandValidator = [
  check("id")
    .isMongoId()
    .withMessage("Invalid brand id format."),

  check("name")
    .optional()
    .isString()
    .withMessage("Brand name must be of type string.")
    .isLength({ min: 3 })
    .withMessage("Too short brand name.")
    .isLength({ max: 32 })
    .withMessage("Too long brand name.")
    .custom(async (value, { req }) => {
      req.body.slug = slugify(value);
      const brand = await brandModel.findOne({ name: value });
      if (brand) {
        throw new Error(`I've used this name before.`);
      };
      return true;
    }),

  check("image")
    .optional()
    .isString()
    .withMessage("Brand image must be of type string."),

  validatorMiddleware,
];

exports.deleteBrandValidator = [
  check("id")
    .isMongoId()
    .withMessage("Invalid brand id format."),

  validatorMiddleware,
];