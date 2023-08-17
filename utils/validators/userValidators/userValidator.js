const { check } = require("express-validator");
const validatorMiddleware = require("../../../middlewares/validatorMiddleware");
const slugify = require("slugify");

const userModel = require("../../../models/userModel");

exports.getUserValidator = [
  check(`id`).isMongoId().withMessage(`Invalid user id format`),
  validatorMiddleware,
];

exports.createUserValidator = [
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
      const user = await userModel.findOne({ email: val });
      if (user) {
        throw new Error("E-mail already in user");
      }
      return true;
    }),

  check("emailVerify")
    .notEmpty()
    .withMessage("Email verify is required")
    .isBoolean(),

  check("phone")
    .notEmpty()
    .withMessage("Phone number is required")
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

  check("role")
    .optional({ checkFalsy: true }) // This field is optional
    .isIn(["user", "manager", "admin"])
    .withMessage("Invalid role"),

  validatorMiddleware,
];

exports.updateUserValidator = [
  check(`id`).isMongoId().withMessage(`Invalid user id format`),

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

  check("email")
    .optional()
    .isString()
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .custom(async (val) => {
      const user = await userModel.findOne({ email: val });
      if (user) {
        throw new Error("E-mail already in user");
      }
      return true;
    }),

  check("emailVerify")
    .optional()
    .isBoolean(),

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

  check("role")
    .optional({ checkFalsy: true }) // This field is optional
    .isIn(["user", "manager", "admin"])
    .withMessage("Invalid role"),

  validatorMiddleware,
];

exports.changeUserPasswordValidator = [
  check(`id`)
    .isMongoId()
    .withMessage(`Invalid user id format`),

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

exports.userBlockValidator = [
  check(`id`)
    .isMongoId()
    .withMessage(`Invalid user id format`),

  check("userBlock")
    .notEmpty()
    .withMessage("User block is required")
    .isBoolean(),

  validatorMiddleware,
];

exports.deleteUserValidator = [
  check(`id`)
    .isMongoId()
    .withMessage(`Invalid user id format`),
  validatorMiddleware,
];