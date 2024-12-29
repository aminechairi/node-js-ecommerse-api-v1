const { check } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const slugify = require("slugify");

const brandModel = require("../../models/brandModel");

exports.getBrandValidator = [
  check("id")
    .isMongoId()
    .withMessage("Invalid brand ID format."),

  validatorMiddleware,
];

exports.createBrandValidator = [
  check("name")
    .notEmpty()
    .withMessage("Brand name is required.")
    .isString()
    .withMessage("Brand name must be of type string.")
    .isLength({ min: 2 })
    .withMessage("Brand name must be at least 2 characters.")
    .isLength({ max: 32 })
    .withMessage("Brand name cannot exceed 32 characters.")
    .custom(async (value, { req }) => {
      req.body.slug = slugify(value);
      const brand = await brandModel.findOne({ name: value });
      if (brand) {
        throw new Error(`This brand name already used.`);
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
    .withMessage("Invalid brand ID format.")
    .custom(async (id) => {
      const brand = await brandModel.findById(id);
      if (!brand) throw new Error(`No brand for this ID ${id}.`);
    }),

  check("name")
    .optional()
    .isString()
    .withMessage("Brand name must be of type string.")
    .isLength({ min: 2 })
    .withMessage("Brand name must be at least 2 characters.")
    .isLength({ max: 32 })
    .withMessage("Brand name cannot exceed 32 characters.")
    .custom(async (value, { req }) => {
      req.body.slug = slugify(value);
      const brand = await brandModel.findOne({ name: value });
      if (brand) {
        throw new Error(`This brand name already used.`);
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
    .withMessage("Invalid brand ID format."),

  validatorMiddleware,
];

exports.imageValidator = [
  check("image")
    .notEmpty()
    .withMessage("Brand image is required."),

  validatorMiddleware,
];