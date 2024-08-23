const { check } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");

const reviewModel = require("../../models/reviewModel");
const productModel = require("../../models/productModel");

exports.getReviewsValidator = [
  check("productId")
    .optional()
    .isMongoId()
    .withMessage("Invalid product ID format."),

  validatorMiddleware,
];

exports.getReviewValidator = [
  check("id")
    .isMongoId()
    .withMessage("Invalid review ID format."),

  validatorMiddleware,
];

exports.createReviewValidator = [
  check("comment")
    .optional()
    .isString()
    .withMessage("Comment must be of type string.")
    .isLength({ max: 200 })
    .withMessage("Comment cannot exceed 200 characters."),

  check("ratings")
    .notEmpty()
    .withMessage("Ratings value is required.")
    .isNumeric()
    .withMessage("Ratings must be of type number.")
    .isFloat({ min: 1, max: 5 })
    .withMessage("Ratings value must be between 1 to 5."),

  check("product")
    .notEmpty()
    .withMessage("Product ID is required.")
    .isMongoId()
    .withMessage("Invalid product ID format.")
    .custom(async (val) => {
      const checkProduct = await productModel.findById(val);
      if (!checkProduct) {
        throw new Error(`No product for this ID ${val}.`);
      };
      return true;
    })
    .custom(async (_, { req }) => {
      const checReview = await reviewModel.findOne({
        user: req.user._id,
        product: req.body.product,
      });
      if (checReview) {
        throw new Error("You have already submitted a review for this product.");
      };
      return true;
    }),

  validatorMiddleware,
];

exports.updateReviewValidator = [
  check("id")
    .isMongoId()
    .withMessage("Invalid review ID format.")
    .custom(async (val, { req }) => {
      // Check review ownership before update
      const checkUser = await reviewModel.findById(val);
      if (!checkUser) {
        throw new Error(`No review for this ID ${val}.`);
      };
      if (checkUser.user._id.toString() !== req.user._id.toString()) {
        throw new Error("You are not authorized to update this review.");
      };
      return true;
    }),

  check("comment")
    .optional()
    .isString()
    .withMessage("Comment must be of type string.")
    .isLength({ max: 200 })
    .withMessage("Comment cannot exceed 200 characters."),

  check("ratings")
    .optional()
    .isNumeric()
    .withMessage("Ratings must be of type number.")
    .isFloat({ min: 1, max: 5 })
    .withMessage("Ratings value must be between 1 to 5."),

  validatorMiddleware,
];

exports.deleteReviewValidator = [
  check("id")
    .isMongoId()
    .withMessage("Invalid review ID format.")
    .custom(async (val, { req }) => {
      if (req.user.role === "user") {
        // Check review ownership before update
        const checkUser = await reviewModel.findById(val);
        if (!checkUser) {
          throw new Error(`No review for this ID ${val}.`);
        };
        if (checkUser.user._id.toString() !== req.user._id.toString()) {
          throw new Error(`You are not authorized to delete this review.`);
        };
      }
      return true;
    }),
  validatorMiddleware,
];
