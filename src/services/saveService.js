const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiErrore");

const { getAll } = require("./handlersFactory");
const saveModel = require("../models/saveModel");

// @desc    Logged user add product to saves
// @route   POST /api/v1/saves
// @access  Private
exports.addProductToSaves = asyncHandler(async (req, res) => {
  const save = await saveModel.create({
    userId: req.user._id,
    productId: req.body.productId,
  });
  res.status(200).json({
    data: save,
  });
});

// @desc    logged user remove product from saves
// @route   DELETE /api/v1/saves/:productId
// @access  Private
exports.removeProductFromeSaves = asyncHandler(async (req, res, next) => {
  const productId = req.params.productId;
  const save = await saveModel.findOneAndDelete({
    userId: req.user._id,
    productId: productId,
  });
  if (!save) {
    throw new ApiError(`No saved product for this id ${productId}.`, 404);
  }
  res.status(200).json({
    data: save,
  });
});

exports.createFilterObj = (req, _, next) => {
  req.filterObj = {
    userId: req.user._id,
  };
  next();
};

// @desc   Logged user get saves
// @route   GET /api/v1/saves
// @access  Private
exports.getSaves = getAll(saveModel);