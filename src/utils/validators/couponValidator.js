const { check } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");

const couponModel = require("../../models/couponModel");

exports.getCouponValidator = [
  check("id")
    .isMongoId()
    .withMessage("Invalid coupon ID format"),

  validatorMiddleware,
];

exports.createCouponValidator = [
  check("couponCode")
    .notEmpty()
    .withMessage("Coupon code is required.")
    .isString()
    .withMessage("Coupon code must be of type string.")
    .isLength({ min: 3 })
    .withMessage("Coupon code must be at least 3 characters.")
    .isLength({ max: 32 })
    .withMessage("Coupon code cannot exceed 32 characters.")
    .custom(async (value, { req }) => {
      req.body.couponCode = `${value}`.toUpperCase();
      const coupon = await couponModel.findOne({
        couponCode: req.body.couponCode,
      });
      if (coupon) {
        throw new Error("I've used this coupon code before.");
      }
      return true;
    }),

  check("expire")
    .notEmpty()
    .withMessage("Expiration date is required.")
    .isString()
    .withMessage("Expiration date must be of type string.")
    .isISO8601({ strict: true })
    .withMessage("Expiration date must be in the format yyyy-mm-dd (ISO 8601).")
    .custom((value) => {
      const inputDate = new Date(value);
      if (inputDate <= Date.now()) {
        throw new Error("Expiration date must be in the future.");
      }
      return true;
    }),

  check("discount")
    .notEmpty()
    .withMessage("Discount value is required.")
    .isNumeric()
    .withMessage("Discount value must be of type number.")
    .isFloat({ min: 1 })
    .withMessage("Discount value must be at least 1%.")
    .isFloat({  max: 100 })
    .withMessage("Discount value cannot exceed 100%."),

  validatorMiddleware,
];

exports.updateCouponValidator = [
  check("id")
    .isMongoId()
    .withMessage("Invalid coupon ID format."),

  check("couponCode")
    .optional()
    .isString()
    .withMessage("Coupon code must be of type string.")
    .isLength({ min: 3 })
    .withMessage("Coupon code must be at least 3 characters.")
    .isLength({ max: 32 })
    .withMessage("Coupon code cannot exceed 32 characters.")
    .custom(async (value, { req }) => {
      req.body.couponCode = `${value}`.toUpperCase();
      const coupon = await couponModel.findOne({
        couponCode: req.body.couponCode,
      });
      if (coupon) {
        throw new Error("I've used this coupon code before.");
      }
      return true;
    }),

    check("expire")
    .optional()
    .isString()
    .withMessage("Expiration date must be of type string.")
    .isISO8601({ strict: true })
    .withMessage("Expiration date must be in the format yyyy-mm-dd (ISO 8601).")
    .custom((value) => {
      const inputDate = new Date(value);
      if (inputDate <= Date.now()) {
        throw new Error("Expiration date must be in the future.");
      }
      return true;
    }),

  check("discount")
    .optional()
    .isNumeric()
    .withMessage("Discount value must be of type number.")
    .isFloat({ min: 1 })
    .withMessage("Discount value must be at least 1%.")
    .isFloat({  max: 100 })
    .withMessage("Discount value cannot exceed 100%."),

  validatorMiddleware,
];

exports.deleteCouponValidator = [
  check("id")
    .isMongoId()
    .withMessage("Invalid coupon ID format."),

  validatorMiddleware,
];
