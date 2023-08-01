const { check } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const slugify = require("slugify");

const userMudel = require("../../models/userModel");

exports.signUpValidator = [
  check("firstName")
    .notEmpty()
    .withMessage("First name is required")
    .isString()
    .trim()
    .isLength({ min: 3, max: 16 })
    .withMessage("First name should be between 3 and 16 characters"),

  check("lastName")
    .notEmpty()
    .withMessage("Last name is required")
    .isString()
    .trim()
    .isLength({ min: 2, max: 16 })
    .withMessage("Last name should be between 2 and 16 characters")
    .custom((value, { req }) => {
      const frisrName = req.body.firstName;
      const lastName = req.body.lastName;
      req.body.slug = slugify(`${frisrName} ${lastName}`);
      return true;
    }),

  check("email")
    .notEmpty()
    .withMessage("Email is required")
    .isString()
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .custom(async (val) => {
      const user = await userMudel.findOne({ email: val });
      if (user) {
        throw new Error("E-mail already in user");
      }
      return true;
    }),

  check("phone")
    .notEmpty()
    .withMessage("Phone number is required")
    .isString()
    .trim()
    .isMobilePhone(["ar-MA"])
    .withMessage("Invalid phone number only accepted Morocco Phone numbers"),

  check("password")
    .notEmpty()
    .withMessage("Password is required")
    .isString()
    .trim()
    .isLength({ min: 8 })
    .withMessage("Password should be at least 8 characters long"),

  check("passwordConfirm")
    .notEmpty()
    .withMessage("Password confirm is required")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Password confirm dose not match password");
      }
      return true;
    }),

  validatorMiddleware,
];

exports.logInValidator = [
  check("email")
    .notEmpty()
    .withMessage("Email is required")
    .isString()
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address"),

  check("password")
    .notEmpty()
    .withMessage("Password is required")
    .isString()
    .trim(),

  validatorMiddleware,
];

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