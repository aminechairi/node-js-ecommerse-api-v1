const express = require(`express`);

const {
  signupValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} = require("../utils/validators/authValidator");
const {
  signup,
  login,
  forgotPassword,
  verifyPassResetCode,
  resetPassword
} = require("../services/authService");

const routes = express.Router();

routes
  .route("/signup")
  .post(
    signupValidator,
    signup
  );

routes
  .route("/login")
  .post(
    loginValidator,
    login
  );

routes
    .route("/forgotpassword")
    .post(
      forgotPasswordValidator,
      forgotPassword
    );

routes
    .route("/verifyresetcode")
    .post(
      verifyPassResetCode
    );

routes
    .route("/resetpassword")
    .put(
      resetPasswordValidator,
      resetPassword
    );

module.exports = routes;