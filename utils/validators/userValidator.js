const { check } = require("express-validator");
const slugify = require("slugify");
const bcrypt = require("bcryptjs");

const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const userModel = require("../../models/userModel");

exports.getUserValidator = [
  check(`id`)
    .isMongoId()
    .withMessage(`Invalid user id format`),
  validatorMiddleware,
];

exports.createUserValidator = [
  check("userName")
    .isString()
    .withMessage("Nser name invalid")
    .notEmpty()
    .withMessage("User name required")
    .isLength({ min: 3 })
    .withMessage("Too short user name")
    .isLength({ max: 22 })
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
    .optional()
    .isMobilePhone("ar-MA")
    .withMessage("Invalid phone number"),

  check("profileImg")
    .optional(),

  check("passwordConfirm")
    .notEmpty()
    .withMessage("passwordConfirm is required"),

  check("password")
    .notEmpty()
    .withMessage("Password is required")
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

  check("role")
    .optional()
    .custom((value) => {
      let roleslist = ["admin", "manager", "user"];
      if (!roleslist.includes(value)) {
        throw new Error(`Role invalid`);
      }
      return true;
    }),

  validatorMiddleware,
];

exports.updateUserValidator = [
  check(`id`)
    .isMongoId()
    .withMessage(`Invalid user id format`),

  check("userName")
    .optional()
    .isLength({ min: 3 })
    .withMessage("Too short user name")
    .isLength({ max: 22 })
    .withMessage("Too long user name")
    .custom((value, { req }) => {
      req.body.slug = slugify(value);
      return true;
    }),

  check("email")
    .optional()
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
    .optional()
    .isMobilePhone("ar-MA")
    .withMessage("Invalid phone number"),

  check("role")
  .optional()
  .custom((value) => {
    let roleslist = ["admin", "manager", "user"];
    if (!roleslist.includes(value)) {
      throw new Error(`Role invalid`);
    }
    return true;
  }),

  validatorMiddleware,
];

exports.changeUserPasswordValidator = [
  check(`id`)
    .isMongoId()
    .withMessage(`Invalid user id format`),

  check("currentPassword")
    .notEmpty()
    .withMessage("currentPassword is required")
    .custom(async (currentPassword, { req }) => {
      const user = await userModel.findById(req.params.id);
      if (!user) {
        throw new Error(`There is no user for this id ${req.params.id}`);
      }
      const iscurrentPassword = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!iscurrentPassword) {
        throw new Error("currentPassword is incorrect");
      }
      return true;
    }),

  check("passwordConfirm")
    .notEmpty()
    .withMessage("PasswordConfirm is required"),

  check("password")
    .notEmpty()
    .withMessage("Password is required")
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

exports.deleteUserValidator = [
  check(`id`)
    .isMongoId()
    .withMessage(`Invalid user id format`),
  validatorMiddleware,
];

exports.updateLoggedUserPasswordValidator = [
  check("currentPassword")
    .notEmpty()
    .withMessage("currentPassword is required")
    .custom(async (currentPassword, { req }) => {
      const user = await userModel.findById(req.user._id);
      const iscurrentPassword = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!iscurrentPassword) {
        throw new Error("currentPassword is incorrect");
      }
      return true;
    }),

  check("passwordConfirm")
    .notEmpty()
    .withMessage("passwordConfirm is required"),

  check("password")
    .notEmpty()
    .withMessage("Password is required")
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

exports.updateLoggedUserDataValidator = [
  check("userName")
    .optional()
    .isLength({ min: 3 })
    .withMessage("Too short user name")
    .isLength({ max: 32 })
    .withMessage("Too long user name")
    .custom((value, { req }) => {
      req.body.slug = slugify(value);
      return true;
    }),

  check("email")
    .optional()
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
    .optional()
    .isMobilePhone("ar-MA")
    .withMessage("Invalid phone number"),

  validatorMiddleware,
];