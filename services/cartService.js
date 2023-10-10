const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiErrore');

const productModel = require('../models/productModel');
const couponModel = require('../models/couponModel');
const cartModel = require('../models/cartModel');
const {
  checkProductsIfDeletedOrVariable,
  calcTotalCartPrice
} = require("../utils/shoppingCartProcessing");

// @desc    Logged user add product to cart
// @route   POST /api/v1/cart
// @access  Private
exports.loggedUserAddProduct = asyncHandler(async (req, res, next) => {
  const { productId, quantity } = req.body;
  const product = await productModel.findById(productId);
  // Get shopping cart
  let cart = await cartModel.findOne({ user: req.user._id });
  // Check shopping cart if available
  if (!cart) {
    // Product validations
    if (!product) {
      return next(new ApiError(`No product for this id ${productId}`, 404));
    };
    if (product.quantity <= 0) {
      return next(new ApiError(`Sorry, this product is currently no longer available.`, 404));
    };
    if (product.quantity < quantity) {
      return next(new ApiError(`Sorry, the quantity you are ordering of this product is not available nothing remains ${product.quantity} product.`, 404));
    };
    // Created shpping cart
    cart = await cartModel.create({
      user: req.user._id,
      cartItems: [
        { 
          product: productId,
          quantity,
          color: product.color,
          price: product.priceAfterDiscount || product.price
        }
      ],
    });
  } else {
    // Check products if deleted or variable
    checkProductsIfDeletedOrVariable(cart);
    // Calc total cart price 
    await calcTotalCartPrice(cart);
    await cart.save();
    // Product validations
    if (!product) {
      return next(new ApiError(`No product for this id ${productId}`, 404));
    };
    if (product.quantity <= 0) {
      return next(new ApiError(`Sorry, this product is currently no longer available.`, 404));
    };
    if (product.quantity < quantity) {
      return next(new ApiError(`Sorry, the quantity you are ordering of this product is not available nothing remains ${product.quantity} product.`, 404));
    };
    //  Check product if already available in shopping cart
    const productIndex = cart.cartItems.findIndex(
      (item) => item.product._id.toString() === productId
    );
    if (productIndex > -1) {
      // Update product quantity
      const cartItem = cart.cartItems[productIndex];
      cartItem.quantity = quantity || 1;
      cart.cartItems[productIndex] = cartItem;
    } else {
      // Add new product in shopping cart
      cart.cartItems.push({ 
        product: productId,
        quantity, color: product.color,
        price: product.priceAfterDiscount || product.price
      });
    };
  };
  // Calc total cart price 
  await calcTotalCartPrice(cart);
  await cart.save();
  // Response
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
  // Get shopping cart
  let cart = await cartModel.findOne({ user: req.user._id });
  // Check shopping cart if available
  if (!cart) {
    return next(
      new ApiError(`No shopping cart for this user id ${req.user._id}.`, 404)
    );
  };
  // Check products if deleted or variable
  checkProductsIfDeletedOrVariable(cart);
  // Calc total cart price 
  await calcTotalCartPrice(cart);
  await cart.save();
  // Response
  res.status(200).json({
    numOfCartItems: cart.cartItems.length,
    data: cart,
  });
});

// @desc    logged user remove product from cart by id
// @route   DELETE /api/v1/cart/:productId
// @access  Private
exports.loggedUserRemoveProduct = asyncHandler(async (req, res, next) => {
  const productId = req.params.productId;
  // Get shopping cart
  let cart = await cartModel.findOneAndUpdate(
    { user: req.user._id },
    {
      $pull: { cartItems: { _id: productId } },
    },
    { new: true }
  );
  // Check shopping cart if available
  if (!cart) {
    return next(
      new ApiError(`No shopping cart for this user id ${req.user._id}.`, 404)
    );
  };
  // Check products if deleted or variable
  checkProductsIfDeletedOrVariable(cart);
  // Calc total cart price 
  await calcTotalCartPrice(cart);
  await cart.save();
  // Response
  res.status(200).json({
    status: 'success',
    message: 'Product removed from shopping cart successfully.',
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
    message: 'Shopping cart clear successfully.',
  });
});

// @desc    Logged user update product quantity from cart by id
// @route   PUT /api/v1/cart/:productId
// @access  Private
exports.loggedUserUpdateProductQuantity = asyncHandler(async (req, res, next) => {
  const productId = req.params.productId;
  const { quantity } = req.body;
  // Get shopping cart
  const cart = await cartModel.findOne({ user: req.user._id });
   // Check shopping cart if available
  if (!cart) {
    return next(new ApiError(`No shopping cart for this user id ${req.user._id}.`, 404));
  };
  // Check products if deleted or variable
  checkProductsIfDeletedOrVariable(cart);
  // Calc total cart price 
  await calcTotalCartPrice(cart);
  await cart.save();
  // Check product if already available in shopping cart
  const itemIndex = cart.cartItems.findIndex(
    (item) => item._id.toString() === productId
  );
  if (itemIndex > -1) {
    const id = cart.cartItems[itemIndex].product._id
    // Get product
    const product = await productModel.findById(id);
    // Product validations
    if (product.quantity < quantity) {
      return next(new ApiError(`Sorry, the quantity you are ordering of this product is not available nothing remains ${product.quantity} product.`, 404));
    };
    // Update product quantity
    const cartItem = cart.cartItems[itemIndex];
    cartItem.quantity = quantity;
    cart.cartItems[itemIndex] = cartItem;
    await calcTotalCartPrice(cart);
    await cart.save();
  } else {
    return next(new ApiError(`No product in shopping cart for this id ${productId}.`, 404));
  };
  // Response
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
  const couponName = `${req.body.coupon}`.toUpperCase();
  // Get coupon
  const coupon = await couponModel.findOne({
    name: couponName,
    expire: { $gt: Date.now() },
  });
  // Check coupon if already available
  if (!coupon) {
    return next(new ApiError(`Coupon is invalid or expired`, 404));
  };
  // Get shopping cart
  let cart = await cartModel.findOne({ user: req.user._id });
  // Check shopping cart if available
  if (!cart) {
    return next(new ApiError(`No shopping cart for this user id ${req.user._id}.`, 404));
  };
  // Check products if deleted or variable
  checkProductsIfDeletedOrVariable(cart);
  // Calc total cart price 
  await calcTotalCartPrice(cart);
  // apply coupon
  const totalPrice = cart.totalPrice;
  const totalPriceAfterDiscount = (totalPrice - (totalPrice * coupon.discount) / 100).toFixed(2); // 99.23
  cart.couponName = coupon.name;
  cart.couponDiscount = coupon.discount;
  cart.totalPriceAfterDiscount = totalPriceAfterDiscount;
  await cart.save();
  // Response
  res.status(200).json({
    status: 'success',
    message: 'Price discount successfully.',
    numOfCartItems: cart.cartItems.length,
    data: cart,
  });
});