const { check } = require("express-validator");
const slugify = require("slugify");

const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const userModel = require("../../models/userModel");

exports.signupValidator = [
  check("userName")
    .notEmpty()
    .withMessage("User name is required")
    .isLength({ min: 3 })
    .withMessage("Too short user name")
    .isLength({ max: 32 })
    .withMessage("Too long user name")
    .custom((value, { req }) => {
      req.body.slug = slugify(value);
      return true;
    }),

  check("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email address")
    .custom(async (value) => {
      const email = await userModel.findOne({
        email: value,
      });
      if (email) {
        throw new Error(`E-mail already is user`);
      } else {
        return true;
      }
    }),

  check("phone")
    .notEmpty()
    .withMessage("Phone number is required")
    .isMobilePhone("ar-MA")
    .withMessage("Invalid phone number"),

  check("passwordConfirm")
    .notEmpty()
    .withMessage("passwordConfirm is required"),

  check("password")
    .notEmpty()
    .withMessage("Password required")
    .isLength({ min: 6 })
    .withMessage("Too short password")
    .isLength({ max: 32 })
    .withMessage("Too long password")
    .custom((password, { req }) => {
      if (password !== req.body.passwordConfirm) {
        throw new Error("passwordConfirm is not valid");
      }
      return true;
    }),

  validatorMiddleware,
];

exports.loginValidator = [
  check("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email address"),

  check("password")
    .notEmpty()
    .withMessage("Password is required"),

  validatorMiddleware,
];

exports.forgotPasswordValidator = [
  check("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email address"),

  validatorMiddleware,
];

exports.resetPasswordValidator = [
  check("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email address"),

  check("newPasswordConfirm")
    .notEmpty()
    .withMessage("newPasswordConfirm is required"),

  check("newPassword")
    .notEmpty()
    .withMessage("newPassword is required")
    .isLength({ min: 6 })
    .withMessage("Too short newPassword")
    .isLength({ max: 32 })
    .withMessage("Too long newPassword")
    .custom((newPassword, { req }) => {
      if (newPassword !== req.body.newPasswordConfirm) {
        throw new Error("newPasswordConfirm is not valid");
      }
      return true;
    }),

  validatorMiddleware,
];