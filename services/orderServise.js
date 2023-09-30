const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiErrore');

const {
  getAll,
} = require('./handlersFactory');
const productModel = require('../models/productModel');
const cartModel = require('../models/cartModel');
const orderModel = require('../models/orderModel');

// @desc    create cash order
// @route   POST /api/v1/orders/cartId
// @access  Protected/User
exports.createCashOrder = asyncHandler(async (req, res, next) => {
  // 1) Get cart depend on cartId
  const cart = await cartModel.findById(req.params.cartId);
  if (!cart) {
    return next(
      new ApiError(`No cart for this id ${req.params.cartId}.`, 404)
    );
  };
  if (cart.cartItems.length === 0) {
    return next(
      new ApiError(`This oredr is not valid.`, 404)
    );
  };
  // 2) Create order with default paymentMethodType cash
  const order = await orderModel.create({
    user: req.user._id,
    cartItems: cart.cartItems,
    shippingAddress: req.body.shippingAddress,
    taxPrice: cart.taxPrice,
    shippingPrice: cart.shippingPrice,
    totalPrice: cart.totalPrice,
    couponName: cart.couponName,
    couponDiscount: cart.couponDiscount,
    totalPriceAfterDiscount: cart.totalPriceAfterDiscount,
  });
  // 3) After creating order, decrement product quantity, increment product sold
  if (order) {
    const bulkOption = cart.cartItems.map((item) => ({
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { quantity: -item.quantity, sold: +item.quantity } },
      },
    }));
    await productModel.bulkWrite(bulkOption, {});
    // 5) Clear cart depend on cartId
    await cartModel.findByIdAndDelete(req.params.cartId);
  };
  res.status(201).json({
    status: 'success',
    message: `The order was completed successfully.`,
    data: order
  });
});

exports.filterOrderForLoggedUser = asyncHandler(async (req, res, next) => {
  if (req.user.role === 'user') req.filterObj = { user: req.user._id };
  next();
});

// @desc    Get all orders
// @route   POST /api/v1/orders
// @access  Pravite
exports.getOrders = getAll(orderModel);

// @desc    Get order by id
// @route   POST /api/v1/orders
// @access  Pravite
exports.getOrder = asyncHandler(async (req, res, next) => {
  const id = await req.params.id;
  let order =  undefined;
  if (req.user.role === 'user') {
    order = await orderModel.findOne({
      _id: id,
      user: req.user._id
    });
  } else {
    order = await orderModel.findById(id);
  };
  if (!order) {
    return next(new ApiError(`No order for this id ${id}`, 404));
  };
  res.status(200).json({ data: order });
});

// @desc    Update order paid
// @route   PUT /api/v1/orders/:id/paid
// @access  Pravite
exports.updateOrderPaid = asyncHandler(async (req, res, next) => {
  const id  = req.params.id;
  const isPaid = req.body.isPaid;
  const order = await orderModel.findById(id);
  if (!order) {
    return next(new ApiError(`No order for this id ${id}`, 404));
  };
  if (isPaid) {
    order.isPaid = true;
    order.paidAt = Date.now();
  } else {
    order.isPaid = false;
    order.paidAt = undefined;    
  };
  const updatedOrder = await order.save();
  res.status(200).json({ status: 'success', data: updatedOrder });
});

// @desc    Update order delivered
// @route   PUT /api/v1/orders/:id/delivered
// @access  Pravite
exports.updateOrderDelivered = asyncHandler(async (req, res, next) => {
  const id  = req.params.id;
  const isDelivered = req.body.isDelivered;
  const order = await orderModel.findById(id);
  if (!order) {
    return next(new ApiError(`No order for this id ${id}`, 404));
  };
  if (isDelivered) {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
  } else {
    order.isDelivered = false;
    order.deliveredAt = undefined;    
  };
  const updatedOrder = await order.save();
  res.status(200).json({ status: 'success', data: updatedOrder });
});