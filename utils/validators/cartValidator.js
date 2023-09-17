const { check } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");

exports.loggedUserAddProductValidator = [
  check("productId")
    .notEmpty()
    .withMessage("Product id is required.")
    .isMongoId()
    .withMessage("Invalid product id format."),

  check("quantity")
    .optional()
    .isNumeric()
    .withMessage("quantity must be of type number.")
    .isFloat({ min: 1, })
    .withMessage("Quantity number cannot be less than 1."),

  check("color")
    .notEmpty()
    .withMessage("Color name is required.")
    .isString()
    .withMessage("Color name must be of type string.")
    .trim()
    .isLength({ min: 3 })
    .withMessage("Too short color name.")
    .isLength({ max: 32 })
    .withMessage("Too long color name."),

  validatorMiddleware,
];

exports.loggedUserRemoveProductValidator = [
  check("productId")
    .notEmpty()
    .withMessage("product id is required.")
    .isMongoId()
    .withMessage("Invalid product id format."),

  validatorMiddleware,
];

exports.loggedUserUpdateProductQuantityValidator = [
  check("productId")
    .notEmpty()
    .withMessage("product id is required.")
    .isMongoId()
    .withMessage("Invalid product id format."),

    check("quantity")
    .notEmpty()
    .withMessage("quantity is required.")
    .isNumeric()
    .withMessage("quantity must be of type number.")
    .isFloat({ min: 1, })
    .withMessage("Quantity number cannot be less than 1."),

  validatorMiddleware,
];