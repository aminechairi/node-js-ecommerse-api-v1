const asyncHandler = require("express-async-handler");

const ApiError = require('../utils/apiErrore');
const userModel = require("../models/userModel");

// @desc    Add address to addresses list
// @route   POST /api/v1/addresses
// @access  Private
exports.addAddressToAddresseslist = asyncHandler(async (req, res, next) => {
  const checkListLength = await userModel.findById(req.user._id);
  const max = 8;
  if (checkListLength.addressesList.length > max) {
    throw next(new ApiError(`You cannot create addresses more than ${max} times.`, 403));
  }
  const user = await userModel.findByIdAndUpdate(
    req.user._id,
    {
      $addToSet: { addressesList: req.body },
    },
    { new: true }
  );
  res.status(200).json({
    status: "success",
    message: "address added successfully to your addresses list.",
    data: user.addressesList,
  });
});

// @desc    Remove address from addresses list
// @route   DELETE /api/v1/addresses/:addressId
// @access  Private
exports.removeAddressFromAddresseslist = asyncHandler(async (req, res, next) => {
  const user = await userModel.findByIdAndUpdate(
    req.user._id,
    {
      $pull: { addressesList: { _id: req.params.addressId } },
    },
    { new: true }
  );
  res.status(200).json({
    status: "success",
    message: "address removed successfully from your addresses list.",
    data: user.addressesList,
  });
});

// @desc    Get logged user addresses list
// @route   GET /api/v1/addresses
// @access  Private
exports.getLoggedUserAddressesList = asyncHandler(async (req, res, next) => {
  const user = await userModel.findById(req.user._id);
  res.status(200).json({
    status: "success",
    results: user.addressesList.length,
    data: user.addressesList,
  });
});