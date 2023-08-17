const { check } = require("express-validator");
const validatorMiddleware = require("../../../middlewares/validatorMiddleware");
const slugify = require("slugify");
const bcrypt = require("bcryptjs");

const userModel = require("../../../models/userModel");

exports.emailVerifyCodeValidator = [
  check("emailVerifyCode")
    .notEmpty()
    .withMessage("Please write email verify code")
    .isString()
    .trim(),

  validatorMiddleware,
];

exports.updateMyDataValidator = [
  check("firstName")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 3, max: 16 })
    .withMessage("First name should be between 3 and 16 characters")
    .custom((value, { req }) => {
      const lastName = req.body.lastName;
      if (!lastName) {
        throw new Error("Please write last name");
      }
      return true;
    }),

  check("lastName")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 16 })
    .withMessage("Last name should be between 2 and 16 characters")
    .custom((value, { req }) => {
      const frisrName = req.body.firstName;
      if (!frisrName) {
        throw new Error("Please write frist name");
      }
      return true;
    })
    .custom((value, { req }) => {
      const frisrName = req.body.firstName;
      const lastName = req.body.lastName;
      req.body.slug = slugify(`${frisrName} ${lastName}`);
      return true;
    }),

  check("phone")
    .optional()
    .isString()
    .trim()
    .isMobilePhone(["ar-MA"])
    .withMessage("Invalid phone number only accepted Morocco Phone numbers"),

  check("profileImage")
    .optional({ checkFalsy: true }) // This field is optional
    .isString()
    .trim(),

  check("profileCoverImage")
    .optional({ checkFalsy: true }) // This field is optional
    .isString()
    .trim(),

  validatorMiddleware,
];

exports.changeMyPasswordValidator = [
  check("currentPassword")
    .notEmpty()
    .withMessage("Current password is required")
    .isString()
    .trim(),

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

exports.changeMyEmailValidator = [
  check("newEmail")
    .notEmpty()
    .withMessage("New email is required")
    .isString()
    .trim()
    .isEmail()
    .withMessage("Please provide a valid new email address")
    .custom(async (val) => {
      const user = await userModel.findOne({ email: val });
      if (user) {
        throw new Error("E-mail already in user");
      }
      return true;
    }),

  check("confirmNewEmail")
    .notEmpty()
    .withMessage("Confirm new email is required")
    .custom((value, { req }) => {
      if (value !== req.body.newEmail) {
        throw new Error("Confirm new email dose not match new email.");
      }
      return true;
    }),

  check("password")
    .notEmpty()
    .withMessage("Password is required")
    .isString()
    .trim(),

  validatorMiddleware,
];