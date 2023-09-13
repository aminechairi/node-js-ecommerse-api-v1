const { check } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");

const reviewModel = require("../../models/reviewModel");
const userModel = require("../../models/userModel");
const productModel = require("../../models/productModel");

exports.getReviewsValidator = [
  check("productId")
    .optional()
    .isMongoId()
    .withMessage(`Invalid product id format`),
  validatorMiddleware,
];

exports.getReviewValidator = [
  check(`id`)
    .isMongoId()
    .withMessage(`Invalid review id format`),
  validatorMiddleware,
];

exports.createReviewValidator = [
  check("title")
    .optional()
    .isString()
    .withMessage("title must be of type string")
    .trim(),

  check("ratings")
    .notEmpty()
    .withMessage("Ratings value is required")
    .isNumeric()
    .withMessage("Ratings must be of type number")
    .isFloat({ min: 1, max: 5 })
    .withMessage("Ratings value must be between 1 to 5"),

  check("product")
    .notEmpty()
    .withMessage("Product is required")
    .isMongoId()
    .withMessage("Invalid product id format")
    .custom(async (val, { req }) => {
      const checkProduct = await productModel.findById(val);
      if (!checkProduct) {
        throw new Error(`No product for this id ${val}`);
      };
      return true;
    })
    .custom(async (val, { req }) => {
      const checReview = await reviewModel.findOne({
        user: req.user._id,
        product: req.body.product,
      });
      if (checReview) {
        throw new Error("You already created a review before");
      };
      return true;
    }),

  validatorMiddleware,
];

exports.updateReviewValidator = [
  check(`id`)
    .isMongoId()
    .withMessage(`Invalid review id format`)
    .custom(async (val, { req }) => {
      // Check review ownership before update
      const checkUser = await reviewModel.findById(val);
      if (!checkUser) {
        throw new Error(`There is no review with id ${val}`);
      };
      if (checkUser.user._id.toString() !== req.user._id.toString()) {
        throw new Error(`Your are not allowed to perform this action`);
      };
      return true;
    }),

  check("title")
    .optional()
    .isString()
    .withMessage("title must be of type string")
    .trim(),

  check("ratings")
    .optional()
    .isNumeric()
    .withMessage("Ratings must be of type number")
    .isFloat({ min: 1, max: 5 })
    .withMessage("Ratings value must be between 1 to 5"),
  validatorMiddleware,

];

exports.deleteReviewValidator = [
  check(`id`)
    .isMongoId()
    .withMessage(`Invalid review id format`)
    .custom(async (val, { req }) => {
      if (req.user.role === "user") {
        // Check review ownership before update
        const checkUser = await reviewModel.findById(val);
        if (!checkUser) {
          throw new Error(`There is no review with id ${val}`);
        };
        if (checkUser.user._id.toString() !== req.user._id.toString()) {
          throw new Error(`Your are not allowed to perform this action`);
        };
      }
      return true;
    }),
  validatorMiddleware,
];