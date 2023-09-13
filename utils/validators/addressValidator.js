const { check } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");

const userModel = require("../../models/userModel");

exports.addAddressToAddresseslistValidator = [
  check("alias")
    .notEmpty()
    .withMessage("Alias is required.")
    .isString()
    .withMessage("Alias must be a string.")
    .trim()
    .isLength({ min: 2 })
    .withMessage("Too short alias.")
    .isLength({ max: 32 })
    .withMessage("Too long alias.")
    .custom(async (val, { req }) => {
      const user = await userModel.findById(req.user._id);
      for (let i = 0; i < user.addressesList.length; i++) {
        if (user.addressesList[i].alias === val) {
          throw new Error("I've used this alias before.")
        }
      };
      return true
    }),

  check("details")
    .notEmpty()
    .withMessage("Details is required.")
    .isString()
    .withMessage("Details must be a string.")
    .trim()
    .isLength({ min: 8 })
    .withMessage("Too short details.")
    .isLength({ max: 64 })
    .withMessage("Too long details."),

  check("phone")
    .notEmpty()
    .withMessage("Phone number is required.")
    .isString()
    .withMessage("Phone must be a string.")
    .trim()
    .isMobilePhone(["ar-MA"])
    .withMessage("Invalid phone number only accepted Morocco Phone numbers."),

  check("city")
    .notEmpty()
    .withMessage("City is require.d.")
    .isString()
    .withMessage("City must be a strin.g.")
    .trim()
    .isLength({ min: 3 })
    .withMessage("Too short cit.y.")
    .isLength({ max: 32 })
    .withMessage("Too long cit.y."),

  check("postalCode")
    .notEmpty()
    .withMessage("Postal code is required.")
    .isString()
    .withMessage("Postal code must be a string.")
    .trim()
    .matches(/^\d{5}$/)
    .withMessage("Postal code must be exactly 5 digits."),
  validatorMiddleware,
];

exports.removeAddressFromAddresseslistValidator = [
    check(`addressId`)
    .isMongoId()
    .withMessage(`Invalid address id format.`),
  validatorMiddleware,
];