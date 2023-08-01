const express = require(`express`);

const {
  signUpValidator,
  logInValidator,

  forgotPasswordValidator,
  verifyPassResetCodeValidator,
  resetPasswordValidator,
} = require("../utils/validators/authValidator");
const {
  signUp,
  logIn,
  
  forgotPassword,
  verifyPassResetCode,
  resetPassword,
} = require("../services/authService");

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