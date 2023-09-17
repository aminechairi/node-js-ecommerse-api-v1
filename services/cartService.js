const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiErrore');

const productModel = require('../models/productModel');
const couponModel = require('../models/couponModel');
const cartModel = require('../models/cartModel');

const calcTotalCartPrice = (cart) => {
  let totalPrice = 0;
  cart.cartItems.forEach((item) => {
    totalPrice += item.price * item.quantity;
  });
  cart.totalCartPrice = totalPrice;
  cart.totalPriceAfterDiscount = undefined;
};

// @desc    Logged user add product to cart
// @route   POST /api/v1/cart
// @access  Private
exports.loggedUserAddProduct = asyncHandler(async (req, res, next) => {
  const { productId, quantity, color } = req.body;
  const product = await productModel.findById(productId);
  if (!product) {
    next(new ApiError(`No product for this id ${productId}`, 404));
  };
  // 1) Get Cart for logged user
  let cart = await cartModel.findOne({ user: req.user._id });
  if (!cart) {
    // create cart fot logged user with product
    cart = await cartModel.create({
      user: req.user._id,
      cartItems: [
        { 
          product: productId,
          quantity,
          color,
          price: product.price
        }
      ],
    });
  } else {
    // product exist in cart, update product quantity
    const productIndex = cart.cartItems.findIndex(
      (item) => item.product.toString() === productId && item.color === color
    );
    if (productIndex > -1) {
      const cartItem = cart.cartItems[productIndex];
      cartItem.quantity += quantity || 1;
      cart.cartItems[productIndex] = cartItem;
    } else {
      // product not exist in cart,  push product to cartItems array
      cart.cartItems.push({ product: productId, quantity, color, price: product.price });
    };
    await cart.save();
  };
  // Calculate total cart price
  calcTotalCartPrice(cart);
  await cart.save();
  res.status(200).json({
    status: 'success',
    message: 'Product added to cart successfully.',
    numOfCartItems: cart.cartItems.length,
    data: cart,
  });
});

// @desc    Logged user get cart
// @route   GET /api/v1/cart
// @access  Private
exports.loggedUserGetCart = asyncHandler(async (req, res, next) => {
  const cart = await cartModel.findOne({ user: req.user._id });
  if (!cart) {
    return next(
      new ApiError(`No cart for this user id ${req.user._id}.`, 404)
    );
  };
  res.status(200).json({
    numOfCartItems: cart.cartItems.length,
    data: cart,
  });
});

// @desc    logged user remove product from cart by id
// @route   DELETE /api/v1/cart/:productId
// @access  Private
exports.loggedUserRemoveProduct = asyncHandler(async (req, res) => {
  const productId = req.params.productId;
  const cart = await cartModel.findOneAndUpdate(
    { user: req.user._id },
    {
      $pull: { cartItems: { _id: productId } },
    },
    { new: true }
  );
  calcTotalCartPrice(cart);
  cart.save();
  res.status(200).json({
    status: 'success',
    message: 'Product removed from cart successfully.',
    numOfCartItems: cart.cartItems.length,
    data: cart,
  });
});

// @desc    Logged user clear cart
// @route   DELETE /api/v1/cart
// @access  Private
exports.loggedUserClearCart = asyncHandler(async (req, res) => {
  await cartModel.findOneAndDelete({ user: req.user._id });
  res.status(200).json({
    status: 'success',
    message: 'Cart clear successfully.',
  });
});

// // @desc    Logged user update product quantity from cart by id
// // @route   PUT /api/v1/cart/:productId
// @access  Private
exports.loggedUserUpdateProductQuantity = asyncHandler(async (req, res, next) => {
  const productId = req.params.productId;
  const { quantity } = req.body;
  const cart = await cartModel.findOne({ user: req.user._id });
  if (!cart) {
    return next(new ApiError(`No cart for this user id ${req.user._id}.`, 404));
  };
  const itemIndex = cart.cartItems.findIndex(
    (item) => item._id.toString() === productId
  );
  if (itemIndex > -1) {
    const cartItem = cart.cartItems[itemIndex];
    cartItem.quantity = quantity;
    cart.cartItems[itemIndex] = cartItem;
  } else {
    return next(
      new ApiError(`No product for this id ${productId}.`, 404)
    );
  };
  calcTotalCartPrice(cart);
  await cart.save();
  res.status(200).json({
    status: 'success',
    message: 'Product updated quantity successfully.',
    numOfCartItems: cart.cartItems.length,
    data: cart,
  });
});

// @desc    Logged user apply coupon
// @route   PUT /api/v1/cart/applycoupon
// @access  Private
exports.loggedUserApplyCoupon = asyncHandler(async (req, res, next) => {
  // 1) Get coupon based on coupon name and expire
  const couponName = `${req.body.coupon}`.toUpperCase();
  const coupon = await couponModel.findOne({
    name: couponName,
    expire: { $gt: Date.now() },
  });
  if (!coupon) {
    return next(new ApiError(`Coupon is invalid or expired`, 404));
  };
  // 2) Get logged user cart to get total cart price
  const cart = await cartModel.findOne({ user: req.user._id });
  if (!cart) {
    return next(new ApiError(`No cart for this user id ${req.user._id}.`, 404));
  };
  const totalPrice = cart.totalCartPrice;
  // 3) Calculate price after Discount
  const totalPriceAfterDiscount = (totalPrice - (totalPrice * coupon.discount) / 100).toFixed(2); // 99.23
  cart.totalPriceAfterDiscount = totalPriceAfterDiscount;
  await cart.save();
  res.status(200).json({
    status: 'success',
    message: 'Price discount successfully.',
    numOfCartItems: cart.cartItems.length,
    data: cart,
  });
});