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
    .isLength({ min: 2 })
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
    .custom((_, { req }) => {
      if (!(req.body.image === undefined)) {
        throw new Error('The field you entered for Image is not an Image type.');
      };
      return true;
    }),

  validatorMiddleware,
];

exports.updateBrandValidator = [
  check("id")
    .isMongoId()
    .withMessage("Invalid brand id format.")
    .custom(async (value, { req }) => {
      const brand = await brandModel.findById(value);
      if (!brand) {
        throw new Error(`No brand for this id ${value}.`);
      };
    }),

  check("name")
    .optional()
    .isString()
    .withMessage("Brand name must be of type string.")
    .isLength({ min: 2 })
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
    .custom((_, { req }) => {
      if (!(req.body.image === undefined)) {
        throw new Error('The field you entered for Image is not an Image type.');
      };
      return true;
    }),

  validatorMiddleware,
];

exports.deleteBrandValidator = [
  check("id")
    .isMongoId()
    .withMessage("Invalid brand id format."),

  validatorMiddleware,
];

exports.imageValidator = [
  check("image")
    .notEmpty()
    .withMessage("Brand image is required."),

  validatorMiddleware,
];