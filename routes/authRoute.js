const express = require(`express`);

const {
  signUpValidator,
  logInValidator,
} = require("../utils/validators/authValidators/signIn&logIn");
const {
  forgotPasswordValidator,
  passwordResetCodeValidator,
  resetPasswordValidator,
} = require("../utils/validators/authValidators/forgotPassword");
const {
  signUp,
  logIn,
} = require("../services/authServises/signIn&logIn");
const {
  forgotPassword,
  passwordResetCode,
  resetPassword,
} = require("../services/authServises/forgotPassword");

const router = express.Router();

router
  .route("/signup")
  .post(
    signUpValidator,
    signUp,
  );

router
  .route("/login")
  .post(
    logInValidator,
    logIn
  );

router
  .route("/forgotPassword")
  .post(
    forgotPasswordValidator,
    forgotPassword
  );

router
  .route("/passwordResetCode")
  .post(
    passwordResetCodeValidator,
    passwordResetCode
  );

router
  .route("/resetPassword")
  .put(
    resetPasswordValidator,
    resetPassword
  );

module.exports = router;