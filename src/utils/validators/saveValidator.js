const { check } = require('express-validator');
const validatorMiddleware = require("../../middlewares/validatorMiddleware");

const productModel = require("../../models/productModel");
const saveModel = require("../../models/saveModel");

exports.addProductToSavesValidator = [
  check("productId")
    .isMongoId()
    .withMessage(`Invalid product id format.`)
    .custom(async (val, { req }) => {
      const product = await productModel.findById(val);
      if (!product) {
        throw new Error(`No product for this id ${val}.`);
      };
      const wishList = await saveModel.findOne({
        userId: req.user._id,
        productId: val,
      });
      if (wishList) {
        throw new Error(`Already saved this product ${val}.`);
      };
      return true;
    }),
  validatorMiddleware,
];

exports.removeProductFromeSavesValidator = [
  check("productId")
    .isMongoId()
    .withMessage(`Invalid product id format.`),

  validatorMiddleware,
];