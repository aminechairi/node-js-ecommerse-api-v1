const crypto = require("crypto");

const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");

const userModel = require("../../models/userModel");
const ApiError = require("../../utils/apiErrore");
const sendEmail = require("../../utils/sendEmail");
const createToken = require("../../utils/createToken");
const { userPropertysPrivate } = require("../../utils/propertysPrivate");

// @desc    Forgot password
// @route   POST /api/v1/auth/forgotPassword
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  // 1) Get user by email
  const user = await userModel.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new ApiError(`There is no user with that email ${req.body.email}`, 404)
    );
  };

  // 2) If user exist, Generate hash reset random 6 digits and save it in db
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedResetCode = crypto
    .createHash("sha256")
    .update(resetCode)
    .digest("hex");

  await userModel.updateOne(
    {
      email: user.email,
    },
    {
      // Save hashed password reset code into db
      passwordResetCode: hashedResetCode,
      // Add expiration time for password reset code (10 min)
      passwordResetExpires: Date.now() + 10 * 60 * 1000,
      passwordResetVerified: false,
    }
  );

  // 3) Send the reset code via email
  const message = `
    <div style="text-align: center;font-family: Arial, Helvetica, sans-serif;color: rgb(56, 56, 56);padding: 20px 0px;">
      <h1 style="margin: 0;padding: 0;font-size: 28px;font-weight: 600;margin-bottom: 4px">
        Hi ${user.firstName} ${user.lastName},
      </h1>
      <p style="margin: 0;padding: 0;font-size: 16px;margin-bottom: 4px">
        We received a request to reset the password on your E-shop Account.
      </p>
      <h2 style="margin: 0;padding: 0;font-size: 24px;font-weight: 600;margin-bottom: 4px">
        ${resetCode}
      </h2>
      <p style="margin: 0;padding: 0;font-size: 16px;margin-bottom: 4px">
        Enter this code to complete the reset.
      </p>
    </div>
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset code (valid for 10 min)",
      message,
    });
  } catch (err) {
    await userModel.updateOne(
      {
        email: user.email,
      },
      {
        passwordResetCode: null,
        passwordResetExpires: null,
        passwordResetVerified: null,
      }
    );
    return next(new ApiError("There is an error in sending email", 500));
  };

  res
    .status(200)
    .json({ status: "Success", message: "Reset code sent to email" });
});

// @desc    Verify password reset code
// @route   POST /api/v1/auth/verifyResetCode
// @access  Public
exports.verifyPassResetCode = asyncHandler(async (req, res, next) => {
  // 1) Get user based on reset code
  const hashedResetCode = crypto
    .createHash('sha256')
    .update(req.body.resetCode)
    .digest('hex');

  const user = await userModel.findOne({
    passwordResetCode: hashedResetCode,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) {
    return next(new ApiError('Reset code invalid or expired'));
  };

  // 2) Reset code valid
  await userModel.updateOne(
    {
      email: user.email,
    },
    {
      passwordResetVerified: true,
    }
  );

  res.status(200).json({
    status: 'Success',
  });
});

// @desc    Reset password
// @route   PUT /api/v1/auth/resetPassword
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // 1) Get user based on email
  const document = await userModel.findOne({ email: req.body.email });
  if (!document) {
    return next(
      new ApiError(`There is no user with email ${req.body.email}`, 404)
    );
  }

  // 2) Check if reset code verified
  if (!document.passwordResetVerified) {
    return next(new ApiError('Reset code not verified', 400));
  };

  await userModel.updateOne(
    {
      email: document.email,
    },
    {
      password: await bcrypt.hash(req.body.newPassword, 12),
      passwordChangedAt: Date.now(),
      passwordResetCode: null,
      passwordResetExpires: null,
      passwordResetVerified: null,
    }
  );
  const user = userPropertysPrivate(document);
  
  // 3) if everything is ok, generate token
  const token = createToken(user._id);

  res.status(200).json({ data: user, token });
});