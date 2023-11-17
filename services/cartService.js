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
exports.loggedUserAddProduct= asyncHandler(async (req, res, next) => {

  const { productId, quantity, size } = req.body;

  let price;

  const product = await productModel.findById(productId);
  if (!product) {
    return next(new ApiError(`No product for this id ${productId}.`, 404));
  };

  if (!(product.price === undefined) && !(product.quantity === undefined) && product.sizes.length === 0) {

    if (size) {
      return next(new ApiError(`This product does not contain size.`, 400));
    };

    if (product.quantity <= 0) {
      return next(new ApiError(`Sorry, this product is currently no longer available.`, 404));
    };

    if (product.quantity < quantity) {
      return next(new ApiError(`Sorry, the quantity you are ordering of this product is not available nothing remains ${product.quantity} product.`, 404));
    };

    price = product.priceAfterDiscount || product.price;

  } else if (product.price === undefined && product.quantity === undefined &&  product.sizes.length > 0) {

    if (!size) {
      return next(new ApiError(`Please specify product size.`, 400));
    };

    const sizeItem = product.sizes.filter((item) => {
      return item.size === `${size}`.toUpperCase();
    });

    if (sizeItem.length === 0) {
      return next(new ApiError(`The size you selected is not available.`, 404));
    };

    if (sizeItem[0].quantity <= 0) {
      return next(new ApiError(`Sorry, this product is currently no longer available.`, 404));
    };

    if (sizeItem[0].quantity < quantity) {
      return next(new ApiError(`Sorry, the quantity you are ordering of this product is not available nothing remains ${sizeItem[0].quantity} product.`, 404));
    };

    price = sizeItem[0].priceAfterDiscount || sizeItem[0].price;

  } else {
    return next(new ApiError(`Sorry, this product cannot be purchased.`, 400));
  };


  let cart = await cartModel.findOne({ user: req.user._id });

  if (!cart) {

    cart = await cartModel.create({
      user: req.user._id,
      cartItems: [
        { 
          product: productId,
          quantity,
          size,
          color: product.color,
          price: price,
        }
      ],
    });

  } else {

    checkProductsIfDeletedOrVariable(cart);

    // Check product if already available in shopping cart
    const productIndex = cart.cartItems.findIndex(
      (item) => item.product._id.toString() === productId && `${item.size}`.toUpperCase() === `${size}`.toUpperCase()
    );

    if (productIndex > -1) {

      // Update product quantity
      const cartItem = cart.cartItems[productIndex];
      cartItem.quantity = quantity;
      cart.cartItems[productIndex] = cartItem;

    } else {

      // Add new product in shopping cart
      cart.cartItems.push({ 
        product: productId,
        quantity,
        size,
        color: product.color,
        price: price,
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

  let cart = await cartModel.findOne({ user: req.user._id });

  if (!cart) {
    return next(
      new ApiError(`No shopping cart for this user id ${req.user._id}.`, 404)
    );
  };

  checkProductsIfDeletedOrVariable(cart);
  await calcTotalCartPrice(cart);
  await cart.save();

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

  let cart = await cartModel.findOneAndUpdate(
    { user: req.user._id },
    {
      $pull: { cartItems: { _id: productId } },
    },
    { new: true }
  );

  if (!cart) {
    return next(
      new ApiError(`No shopping cart for this user id ${req.user._id}.`, 404)
    );
  };

  checkProductsIfDeletedOrVariable(cart);
  await calcTotalCartPrice(cart);
  await cart.save();

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

  const cart = await cartModel.findOne({ user: req.user._id });

  if (!cart) {
    return next(new ApiError(`No shopping cart for this user id ${req.user._id}.`, 404));
  };

  checkProductsIfDeletedOrVariable(cart);
  await calcTotalCartPrice(cart);
  await cart.save();

  const cartItem = cart.cartItems.filter(
    (item) => item._id.toString() === productId
  );

  if (cartItem.length === 0) {
    return next(new ApiError(`No product in shopping cart for this id ${productId}.`, 404));
  };

  const product = cartItem[0].product;
  const size = cartItem[0].size;

  if (!(product.price === undefined) && !(product.quantity === undefined) && product.sizes.length === 0) {

    if (product.quantity < quantity) {
      return next(new ApiError(`Sorry, the quantity you are ordering of this product is not available nothing remains ${product.quantity} product.`, 404));
    };

  } else if (product.price === undefined && product.quantity === undefined &&  product.sizes.length > 0) {

    const checkProductSize = product.sizes.filter((item) => {
      return item.size === `${size}`.toUpperCase();
    });

    if (checkProductSize[0].quantity < quantity) {
      return next(new ApiError(`Sorry, the quantity you are ordering of this product is not available nothing remains ${checkProductSize[0].quantity} product.`, 404));
    };

  };

  const productIndex = cart.cartItems.findIndex(
    (item) => item._id.toString() === productId
  );

  const cartItemIndex = cart.cartItems[productIndex];
  cartItemIndex.quantity = quantity;
  cart.cartItems[productIndex] = cartItemIndex;

  await calcTotalCartPrice(cart);
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

  const couponName = `${req.body.coupon}`.toUpperCase();

  const coupon = await couponModel.findOne({
    name: couponName,
    expire: { $gt: Date.now() },
  });

  if (!coupon) {
    return next(new ApiError(`Coupon is invalid or expired`, 404));
  };

  let cart = await cartModel.findOne({ user: req.user._id });

  if (!cart) {
    return next(new ApiError(`No shopping cart for this user id ${req.user._id}.`, 404));
  };

  checkProductsIfDeletedOrVariable(cart);
  await calcTotalCartPrice(cart);

  // apply coupon
  const totalPrice = cart.totalPrice;
  const totalPriceAfterDiscount = (totalPrice - (totalPrice * coupon.discount) / 100).toFixed(2); // 99.23

  cart.couponName = coupon.name;
  cart.couponDiscount = coupon.discount;
  cart.totalPriceAfterDiscount = totalPriceAfterDiscount;
  await cart.save();

  res.status(200).json({
    status: 'success',
    message: 'Price discount successfully.',
    numOfCartItems: cart.cartItems.length,
    data: cart,
  });

});