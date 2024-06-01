const express = require(`express`);

const {
  signUpValidator,
  logInValidator,
} = require("../utils/validators/authValidators/signIn&logIn");
const {
  forgotPasswordValidator,
  verifyPassResetCodeValidator,
  resetPasswordValidator,
} = require("../utils/validators/authValidators/forgotPassword");
const {
  signUp,
  logIn,
} = require("../services/authServises/signIn&logIn");
const {
  forgotPassword,
  verifyPassResetCode,
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
  .route("/verifyResetCode")
  .post(
    verifyPassResetCodeValidator,
    verifyPassResetCode
  );

router
  .route("/resetPassword")
  .put(
    resetPasswordValidator,
    resetPassword
  );

module.exports = router;