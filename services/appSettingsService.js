const asyncHandler = require("express-async-handler");
const ApiError = require('../utils/apiErrore');

const {
  deleteOne,
  updateOne,
} = require("./handlersFactory");
const appSettingsModel = require("../models/appSettingsModel");

// @desc Get app settings
// @route GET /api/v1/appsettings
// @access private
exports.getAppSettings = asyncHandler(async (req, res, next) => {
  const appSettings = await appSettingsModel.findOne({});
  res.status(200).json({
    date: appSettings || {}
  })
});

// @desc Create app settings
// @route POST /api/v1/appsettings
// @access Private 
exports.createAppSettings = asyncHandler(async (req, res, next) => {
  // Get count of products
  const countDocuments = await appSettingsModel.countDocuments();
  if (countDocuments > 0) {
    return next(new ApiError(`You cannot create more than 1 collection.`, 403));
  };
  const appSettings = await appSettingsModel.create(req.body);
  res.status(200).json({
    date: appSettings
  });
});

// @desc Update app settings by id
// @route PUT /api/v1/appsettings/:id
// @access Private
exports.updateAppSettings  = updateOne(appSettingsModel);

// @desc Delete app settings by id
// @route DELETE /api/v1/appsettings/:id
// @access Private
exports.deleteAppSettings = deleteOne(appSettingsModel);