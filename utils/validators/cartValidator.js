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
    .isInt({ min: 1, })
    .withMessage("Prodact quantity number cannot be less than 1 and must be a integer number."),

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
    .isInt({ min: 1, })
    .withMessage("Prodact quantity number cannot be less than 1 and must be a integer number."),

  validatorMiddleware,
];