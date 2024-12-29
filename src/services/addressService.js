const asyncHandler = require("express-async-handler");

const ApiError = require('../utils/apiErrore');
const userModel = require("../models/userModel");

// @desc    Logged user add address to his addresses list.
// @route   POST /api/v1/addresses
// @access  Private
exports.addUserAddress = asyncHandler(async (req, res, next) => {
  const checkListLength = await userModel.findById(req.user._id);
  const max = 8;
  if (checkListLength.addressesList.length > max) {
    throw next(new ApiError(`You cannot create more than ${max} addresses.`, 403));
  }
  const user = await userModel.findByIdAndUpdate(
    req.user._id,
    {
      $addToSet: { addressesList: req.body },
    },
    { new: true }
  );
  res.status(200).json({
    status: "Success",
    message: "Address added successfully to your addresses list.",
    data: user.addressesList,
  });
});

// @desc    Logged user remove address from his addresses list.
// @route   DELETE /api/v1/addresses/:addressId
// @access  Private
exports.removeUserAddress = asyncHandler(async (req, res) => {
  const user = await userModel.findByIdAndUpdate(
    req.user._id,
    {
      $pull: { addressesList: { _id: req.params.addressId } },
    },
    { new: true }
  );
  res.status(200).json({
    status: "Success",
    message: "Address removed successfully from your addresses list.",
    data: user.addressesList,
  });
});

// @desc    Logged user get his addresses.
// @route   GET /api/v1/addresses
// @access  Private
exports.getUserAddresses = asyncHandler(async (req, res) => {
  const user = await userModel.findById(req.user._id);
  res.status(200).json({
    status: "Success",
    results: user.addressesList.length,
    data: user.addressesList,
  });
});