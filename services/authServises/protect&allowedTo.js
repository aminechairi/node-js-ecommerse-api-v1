const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");

const userModel = require("../../models/userModel");
const ApiError = require("../../utils/apiErrore");

// @desc make sure the user is logged in
exports.protect = (emailVerify = false) =>
  asyncHandler(async (req, res, next) => {

    // 1) Check if token exist, if exist get
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
      return next(
        new ApiError(
          "You are not login, Please login to get access this route.",
          401
        )
      );
    }

    // 2) Verify token (no change happens, expired token)
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    // 3) Check if user exists
    const currentUser = await userModel.findById(decoded.userId);
    if (!currentUser) {
      return next(
        new ApiError(
          "The user that belong to this token does no longer exist.",
          401
        )
      );
    }

    // 4) Check user if verified email
    if (!emailVerify) {
      if (!currentUser.emailVerify) {
        return next(new ApiError("This user email is not verified.", 401));
      }
    }

    // 5) Check user if block
    if (currentUser.userBlock) {
      return next(new ApiError("The user has been banned.", 401));
    }

    // 6) Check if user change his password after token created
    if (currentUser.passwordChangedAt) {
      const passChangedTimestamp = parseInt(
        currentUser.passwordChangedAt.getTime() / 1000,
        10
      );
      // Password changed after token created (Error)
      if (passChangedTimestamp > decoded.iat) {
        return next(
          new ApiError(
            "User recently changed his password. please login again..",
            401
          )
        );
      };
    };

    req.user = currentUser;

    next();

  });

// @desc  Authorization (User Permissions)
// ["admin", "manager"]
exports.allowedTo = (...roles) =>
  asyncHandler(async (req, res, next) => {
    // 1) access roles
    // 2) access registered user (req.user.role)

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError("You are not allowed to access this route.", 403)
      );
    };

    next();

  });

// check the token
exports.checkTheToken = async (req, next) => {

  // 1) Check if token exist, if exist get
  let token;
  if (req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    throw next(
      new ApiError(
        "You are not login, Please login to get access this route.",
        401
      )
    );
  }

  // 2) Verify token (no change happens, expired token)
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

  // 3) Check if user exists
  const currentUser = await userModel.findById(decoded.userId);
  if (!currentUser) {
    throw next(
      new ApiError(
        "The user that belong to this token does no longer exist.",
        401
      )
    );
  }

  // 4) Check user if verified email
  if (!currentUser.emailVerify) {
    throw next(new ApiError("This user email is not verified.", 401));
  }

  // 5) Check user if block
  if (currentUser.userBlock) {
    throw next(new ApiError("The user has been banned.", 401));
  }

  // 6) Check if user change his password after token created
  if (currentUser.passwordChangedAt) {
    const passChangedTimestamp = parseInt(
      currentUser.passwordChangedAt.getTime() / 1000,
      10
    );
    // Password changed after token created (Error)
    if (passChangedTimestamp > decoded.iat) {
      throw next(
        new ApiError(
          "User recently changed his password. please login again..",
          401
        )
      );
    };
  };

  return currentUser;

};