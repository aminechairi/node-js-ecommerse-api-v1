const asyncHandler = require("express-async-handler");

const {
  getAll,
  getOne,
  deleteOne
} = require('./handlersFactory');
const couponModel = require('../models/couponModel');

// @desc    Get list of coupons
// @route   GET /api/v1/coupons
// @access  Private
exports.getCoupons = getAll(couponModel);

// @desc    Get coupon by id
// @route   GET /api/v1/coupons/:id
// @access  Private
exports.getCoupon = getOne(couponModel);

// @desc    Create coupon
// @route   POST  /api/v1/coupons
// @access  Private
exports.createCoupon = asyncHandler(async (req, res) => {
  req.body.name = `${req.body.name}`.toUpperCase();
  const coupon = await couponModel.create(req.body);
  res.status(201).json({
    data: coupon,
  });
});

// @desc    Update coupon by id
// @route   PUT /api/v1/coupons/:id
// @access  Private
exports.updateCoupon = asyncHandler(async (req, res, next) => {
  req.body.name = `${req.body.name}`.toUpperCase();
  const coupon = await couponModel.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  if (!coupon) {
    return next(new ApiError(`No coupon for this id ${req.params.id}`, 404));
  };
  res.status(200).json({
    data: coupon,
  });
});

// @desc    Delete coupon by id
// @route   DELETE /api/v1/coupons/:id
// @access  Private
exports.deleteCoupon = deleteOne(couponModel);