const { check } = require('express-validator');
const validatorMiddleware = require("../../middlewares/validatorMiddleware");

exports.createAppSettingsValidator = [
  check("taxPrice")
    .notEmpty()
    .withMessage("Tax price is required.")
    .isNumeric()
    .withMessage("Tax price must be of type number.")
    .isFloat({ min: 0, })
    .withMessage("Tax price number cannot be less than 0."),

  check("shippingPrice")
    .notEmpty()
    .withMessage("Shipping price is required.")
    .isNumeric()
    .withMessage("Shipping price must be of type number.")
    .isFloat({ min: 0, })
    .withMessage("Shipping price number cannot be less than 0."),

  validatorMiddleware,
];

exports.updateAppSettingsValidator = [
  check("id")
    .isMongoId()
    .withMessage("Invalid app settings id formate."),

  check("taxPrice")
    .optional()
    .isNumeric()
    .withMessage("Tax price must be of type number.")
    .isFloat({ min: 0, })
    .withMessage("Tax price number cannot be less than 0."),

  check("shippingPrice")
    .optional()
    .isNumeric()
    .withMessage("Shipping price must be of type number.")
    .isFloat({ min: 0, })
    .withMessage("Shipping price number cannot be less than 0."),

  validatorMiddleware,
];

exports.deleteAppSettingsValidator = [
  check("id")
    .isMongoId()
    .withMessage("Invalid app settings id formate."),

  validatorMiddleware,
];