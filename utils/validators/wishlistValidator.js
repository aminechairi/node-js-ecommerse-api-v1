const { check } = require('express-validator');
const validatorMiddleware = require("../../middlewares/validatorMiddleware");

const productModel = require("../../models/productModel");

exports.addProductToWishlistValidator = [
  check("productId")
    .isMongoId()
    .withMessage(`Invalid productId format`)
    .custom(async (val, { req }) => {
      const product = await productModel.findById(val);
      if (!product) {
        throw new Error(`No product for this productId ${val}`);
      };
      return true;
    }),
  validatorMiddleware,
];

exports.removeProductFromWishlisttValidator = [
  check("productId")
    .isMongoId()
    .withMessage(`Invalid productId format`),
  validatorMiddleware,
];