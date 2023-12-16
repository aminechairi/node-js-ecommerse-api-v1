const { check } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const mongoose = require('mongoose');

const productModel = require('../../models/productModel');

// Custom validation function for MongoDB ObjectID
const isValidObjectId = value => mongoose.Types.ObjectId.isValid(value);

exports.getProductsGroupValidator = [
  check("id")
    .notEmpty()
    .withMessage("Products group id is required.")
    .isMongoId()
    .withMessage("Invalid products group id format."),

  validatorMiddleware,
];

exports.creteProductsGroupValidator = [
  check("groupName")
    .notEmpty()
    .withMessage("Group name is required.")
    .isString()
    .withMessage("Group name must be of type string.")
    .isLength({ min: 2 })
    .withMessage("Too short group name.")
    .isLength({ max: 32 })
    .withMessage("Too long group name."),

  check("productsIDs")
    .notEmpty()
    .withMessage('Products IDs is required.')
    .isArray()
    .withMessage("Products IDs must be an array.")
    .custom((value) => {

      if (!( Array.isArray(value) && value.every(isValidObjectId) )) {

        // Check products IDs format
        if (value.length > 1) {
          throw new Error('Invalid products IDs format.');
        } else {
          throw new Error('Invalid product ID format.');
        };

      };

      return true;
    })
    .custom(async (IDs) => {
      const products = await productModel.find({ _id: IDs });

      // Check products IDs is exist
      if (IDs.length !== products.length) {

        if (IDs.length > 1) {
          throw new Error('Invalid products IDs.');
        } else {
          throw new Error('Invalid product ID.');
        };

      };

      // Check if product belong group
      const check = products.some(item => mongoose.Types.ObjectId.isValid(item.group));

      if (check) {
        throw new Error('Product cannot belong to more than one group.');
      };

      return true;
    }),

  validatorMiddleware,
];

exports.updateProductsGroupValidator = [
  check("id")
    .notEmpty()
    .withMessage("Products group id is required.")
    .isMongoId()
    .withMessage("Invalid products group id format."),

  check("groupName")
    .optional()
    .isString()
    .withMessage("Group name must be of type string.")
    .isLength({ min: 2 })
    .withMessage("Too short group name.")
    .isLength({ max: 32 })
    .withMessage("Too long group name."),

  validatorMiddleware,
];

exports.deleteProductsGroupValidator = [
  check("id")
    .notEmpty()
    .withMessage("Products group id is required.")
    .isMongoId()
    .withMessage("Invalid products group id format."),

  validatorMiddleware,
];

exports.addProductsToGroupValidator = [
  check("id")
    .notEmpty()
    .withMessage("Products group id is required.")
    .isMongoId()
    .withMessage("Invalid products group id format."),

  check("productsIDs")
    .notEmpty()
    .withMessage('Products IDs is required.')
    .isArray()
    .withMessage("Products IDs must be an array.")
    .custom((value) => {

      if (!( Array.isArray(value) && value.every(isValidObjectId) )) {

        // Check products IDs format
        if (value.length > 1) {
          throw new Error('Invalid products IDs format.');
        } else {
          throw new Error('Invalid product ID format.');
        };

      };

      return true;
    })
    .custom(async (IDs) => {
      const products = await productModel.find({ _id: IDs });

      // Check products IDs is exist
      if (IDs.length !== products.length) {

        if (IDs.length > 1) {
          throw new Error('Invalid products IDs.');
        } else {
          throw new Error('Invalid product ID.');
        };

      };

      // Check if product belong group
      const check = products.some(item => mongoose.Types.ObjectId.isValid(item.group));

      if (check) {
        throw new Error('Product cannot belong to more than one group.');
      };

      return true;
    }),

  validatorMiddleware,
];

exports.removeProductsFromGroupValidator = [
  check("id")
    .notEmpty()
    .withMessage("Products group id is required.")
    .isMongoId()
    .withMessage("Invalid products group id format."),

  check("productsIDs")
    .notEmpty()
    .withMessage('Products IDs is required.')
    .isArray()
    .withMessage("Products IDs must be an array.")
    .custom((value) => {

      // Check products IDs format
      if (!( Array.isArray(value) && value.every(isValidObjectId) )) {

        if (value.length > 1) {
          throw new Error('Invalid products IDs format.');
        } else {
          throw new Error('Invalid product ID format.');
        };

      };

      return true;
    }),

  validatorMiddleware,
];