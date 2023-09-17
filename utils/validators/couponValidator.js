const { check } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");

const couponModel = require("../../models/couponModel")

exports.getCouponValidator = [
  check(`id`)
    .isMongoId()
    .withMessage(`Invalid id format`),
  validatorMiddleware,
];

exports.createCouponValidator = [
  check("name")
    .notEmpty()
    .withMessage("Coupon name is required")
    .isString()
    .withMessage("Coupon name must be of type string")
    .trim()
    .isLength({ min: 3 })
    .withMessage("Too short coupon name")
    .isLength({ max: 32 })
    .withMessage("Too long coupon name")
    .custom(async (value, { req }) => {
      req.body.name = `${value}`.toUpperCase();      
      const coupon = await couponModel.findOne({ name: req.body.name });
      if (coupon) {
        throw new Error("I've used this coupon name before.");
      };
      return true;
    }),

  check("expire")
    .notEmpty()
    .withMessage("Coupon expire is required")
    .isISO8601('yyyy-mm-dd')
    .withMessage("Coupon expire date format => yyyy-mm-dd"),

    check("discount")
    .notEmpty()
    .withMessage("Coupon discount is required")
    .isNumeric()
    .withMessage("Coupon discount must be of type number")
    .isFloat({ min: 1, max: 100 })
    .withMessage('Discount must be between 1 and 100'),

  validatorMiddleware,
];

exports.updateCouponValidator = [
  check(`id`)
    .isMongoId()
    .withMessage(`Invalid id format`),

  check("name")
    .optional()
    .isString()
    .withMessage("Coupon name must be of type string")
    .trim()
    .isLength({ min: 3 })
    .withMessage("Too short coupon name")
    .isLength({ max: 32 })
    .withMessage("Too long coupon name")
    .custom(async (value, { req }) => {
      req.body.name = `${value}`.toUpperCase();
      const coupon = await couponModel.findOne({ name: req.body.name });
      if (coupon) {
        throw new Error("I've used this coupon name before.");
      };
      return true;
    }),

  check("expire")
    .optional()
    .isISO8601('yyyy-mm-dd')
    .withMessage("Coupon expire date format => yyyy-mm-dd"),

  check("discount")
    .optional()
    .isNumeric()
    .withMessage("Coupon discount must be of type number")
    .isFloat({ min: 1, max: 100 })
    .withMessage('Discount must be between 1 and 100'),

  validatorMiddleware,
];

exports.deleteCouponValidator = [
  check(`id`)
    .isMongoId()
    .withMessage(`Invalid id format`),
  validatorMiddleware,
];