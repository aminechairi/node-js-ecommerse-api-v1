const { check } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");

exports.loggedUserCreateCashOrderValidator = [
  check("cartId")
    .notEmpty()
    .withMessage("Cart id is required.")
    .isMongoId()
    .withMessage("Invalid cart id format."),

  check("shippingAddress.alias")
    .notEmpty()
    .withMessage("Alias is required.")
    .isString()
    .withMessage("Alias must be a string.")
    .isLength({ min: 2 })
    .withMessage("Too short alias.")
    .isLength({ max: 32 })
    .withMessage("Too long alias."),

  check("shippingAddress.details")
    .notEmpty()
    .withMessage("Details is required.")
    .isString()
    .withMessage("Details must be a string.")
    .isLength({ min: 8 })
    .withMessage("Too short details.")
    .isLength({ max: 64 })
    .withMessage("Too long details."),

  check("shippingAddress.phone")
    .notEmpty()
    .withMessage("Phone number is required.")
    .isString()
    .withMessage("Phone must be a string.")
    .isMobilePhone(["ar-MA"])
    .withMessage("Invalid phone number only accepted Morocco Phone numbers."),

  check("shippingAddress.city")
    .notEmpty()
    .withMessage("City is required.")
    .isString()
    .withMessage("City must be a string.")
    .isLength({ min: 3 })
    .withMessage("Too short city.")
    .isLength({ max: 32 })
    .withMessage("Too long city."),

  check("shippingAddress.postalCode")
    .notEmpty()
    .withMessage("Postal code is required.")
    .isString()
    .withMessage("Postal code must be a string.")
    .matches(/^\d{5}$/)
    .withMessage("Postal code must be exactly 5 digits."),

  validatorMiddleware,
];

exports.getOrderValidator = [
  check("id")
    .notEmpty()
    .withMessage("order id is required.")
    .isMongoId()
    .withMessage("Invalid order id format."),

  validatorMiddleware,
];

exports.updateOrderPaidValidator = [
  check("id")
    .notEmpty()
    .withMessage("order id is required.")
    .isMongoId()
    .withMessage("Invalid order id format."),

  validatorMiddleware,
];

exports.updateOrderDeliveredValidator = [
  check("id")
    .notEmpty()
    .withMessage("order id is required.")
    .isMongoId()
    .withMessage("Invalid order id format."),

  validatorMiddleware,
];

exports.checkoutSessionValidator = [
  check("cartId")
    .notEmpty()
    .withMessage("Cart id is required.")
    .isMongoId()
    .withMessage("Invalid cart id format."),

  check("shippingAddress.alias")
    .notEmpty()
    .withMessage("Alias is required.")
    .isString()
    .withMessage("Alias must be a string.")
    .isLength({ min: 2 })
    .withMessage("Too short alias.")
    .isLength({ max: 32 })
    .withMessage("Too long alias."),

  check("shippingAddress.details")
    .notEmpty()
    .withMessage("Details is required.")
    .isString()
    .withMessage("Details must be a string.")
    .isLength({ min: 8 })
    .withMessage("Too short details.")
    .isLength({ max: 64 })
    .withMessage("Too long details."),

  check("shippingAddress.phone")
    .notEmpty()
    .withMessage("Phone number is required.")
    .isString()
    .withMessage("Phone must be a string.")
    .isMobilePhone(["ar-MA"])
    .withMessage("Invalid phone number only accepted Morocco Phone numbers."),

  check("shippingAddress.city")
    .notEmpty()
    .withMessage("City is required.")
    .isString()
    .withMessage("City must be a string.")
    .isLength({ min: 3 })
    .withMessage("Too short city.")
    .isLength({ max: 32 })
    .withMessage("Too long city."),

  check("shippingAddress.postalCode")
    .notEmpty()
    .withMessage("Postal code is required.")
    .isString()
    .withMessage("Postal code must be a string.")
    .matches(/^\d{5}$/)
    .withMessage("Postal code must be exactly 5 digits."),

  validatorMiddleware,
];