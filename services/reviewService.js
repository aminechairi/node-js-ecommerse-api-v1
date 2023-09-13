const asyncHandler = require("express-async-handler");

const {
  getAll,
  getOne,
  deleteOne,
} = require("./handlersFactory");
const reviewModel = require("../models/reviewModel");

// Nested route
// GET /api/v1/products/:productId/reviews
exports.createFilterObj = (req, res, next) => {
  let filterObject = {};
  if (req.params.productId) filterObject = { product: req.params.productId };
  req.filterObj = filterObject;
  next();
};

// @desc    Get list of reviews
// @route   GET /api/v1/reviews
// @access  Public
exports.getReviews = getAll(reviewModel);

// @desc    Get review by id
// @route   GET /api/v1/reviews/:id
// @access  Public
exports.getReview = getOne(reviewModel);

// Nested route (Create)
exports.setProductIdAndUserIdToBody = (req, res, next) => {
  // Nested route (Create)
  if (!req.body.product) req.body.product = req.params.productId;
  if (!req.body.user) req.body.user = req.user._id.toString();
  next();
};

// @desc    Create review
// @route   POST  /api/v1/reviews
// @access  Private
exports.createReview = asyncHandler(async (req, res) => {
  let review = await reviewModel.create({
    title: req.body.title,
    ratings: req.body.ratings,
    user: req.user._id,
    product: req.body.product,
  });
  res.status(201).json({
    data: review,
  });
});

// @desc    Update review by id
// @route   PUT /api/v1/reviews/:id
// @access  Private
exports.updateReview = asyncHandler(async (req, res) => {
  const review = await reviewModel.findByIdAndUpdate(
    req.params.id,
    {
      title: req.body.title,
      ratings: req.body.ratings,
    },
    {
      new: true,
    }
  );
  // Trigger "save" event when update document
  review.save();
  res.status(200).json({
    data: review,
  });
});

// @desc    Delete review by id
// @route   DELETE /api/v1/reviews/:id
// @access  Private
exports.deleteReview = deleteOne(reviewModel);