const { check } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");

exports.loggedUserAddProductValidator = [
  check("productId")
    .notEmpty()
    .withMessage("Product id is required.")
    .isMongoId()
    .withMessage("Invalid product id format."),

  check("quantity")
    .notEmpty()
    .withMessage('Quantity is required.')
    .isNumeric()
    .withMessage("Quantity must be of type number.")
    .isInt({ min: 1, })
    .withMessage("Quantity number cannot be less than 1 and must be a integer number."),

  check('size')
    .optional()
    .isString()
    .withMessage("Size must be of type string.")
    .isLength({ min: 1 })
    .withMessage("Too short size.")
    .isLength({ max: 8 })
    .withMessage("Too long size."),

  validatorMiddleware,
];

exports.loggedUserRemoveProductValidator = [
  check("productId")
    .notEmpty()
    .withMessage("Product id is required.")
    .isMongoId()
    .withMessage("Invalid product id format."),

  validatorMiddleware,
];

exports.loggedUserUpdateProductQuantityValidator = [
  check("productId")
    .notEmpty()
    .withMessage("Product id is required.")
    .isMongoId()
    .withMessage("Invalid product id format."),

    check("quantity")
    .notEmpty()
    .withMessage("Quantity is required.")
    .isNumeric()
    .withMessage("Quantity must be of type number.")
    .isInt({ min: 1, })
    .withMessage("Prodact quantity number cannot be less than 1 and must be a integer number."),

  validatorMiddleware,
];