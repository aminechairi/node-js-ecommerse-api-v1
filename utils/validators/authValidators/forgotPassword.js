const { check } = require("express-validator");
const validatorMiddleware = require("../../../middlewares/validatorMiddleware");

exports.forgotPasswordValidator = [
  check("email")
    .notEmpty()
    .withMessage("Email is required")
    .isString()
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address"),

  validatorMiddleware,
];

exports.verifyPassResetCodeValidator = [
  check("resetCode")
    .notEmpty()
    .withMessage("Please write reset code")
    .isString()
    .trim(),

  validatorMiddleware,
];

exports.resetPasswordValidator = [
  check("email")
    .notEmpty()
    .withMessage("Email is required")
    .isString()
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address"),

  check("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isString()
    .trim()
    .isLength({ min: 8 })
    .withMessage("New password should be at least 8 characters long"),

  check("newPasswordConfirm")
    .notEmpty()
    .withMessage("New password confirm is required")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("New password confirm dose not match new password");
      }
      return true;
    }),

  validatorMiddleware,
];