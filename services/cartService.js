const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiErrore');

const productModel = require('../models/productModel');
const couponModel = require('../models/couponModel');
const cartModel = require('../models/cartModel');

// Check if product quantity or product price variable
let checkProductQuantityAndPrica = (cart) => {
  const cartItems = cart.cartItems.filter((item) => {
    // if delete product
    if (item.product === null) item.product = { quantity: 0, };
    return item.product.quantity >= 1;
  });
  cartItems.forEach((item) => {
    item.product.quantity < item.quantity 
    ? item.quantity = item.product.quantity
    : item.quantity = item.quantity
    item.price = item.product.priceAfterDiscount || item.product.price
  });
  cart.cartItems = cartItems;
};

// Ccheck product if deleted or variable
const checkProductIfDeletedOrVariable = (cart) => {
  // app settings
  const taxPrice = 0;
  const shippingPrice = 0;
  let totalPrice = 0;
  cart.cartItems.forEach((item) => {
    totalPrice += item.price * item.quantity;
  });
  cart.taxPrice = taxPrice;
  cart.shippingPrice = shippingPrice;
  cart.totalPrice = (totalPrice + taxPrice + shippingPrice).toFixed(2);
  cart.couponName = undefined;
  cart.couponDiscount = undefined;
  cart.totalPriceAfterDiscount = undefined;
};

// @desc    Logged user add product to cart
// @route   POST /api/v1/cart
// @access  Private
exports.loggedUserAddProduct = asyncHandler(async (req, res, next) => {

  const { productId, quantity } = req.body;
  const product = await productModel.findById(productId);

  let cart = await cartModel.findOne({ user: req.user._id });

  if (!cart) {

    if (!product) {
      return next(new ApiError(`No product for this id ${productId}`, 404));
    };
    if (product.quantity <= 0) {
      return next(new ApiError(`Sorry, this product is currently no longer available.`, 404));
    };
    if (product.quantity < quantity) {
      return next(new ApiError(`Sorry, the quantity you are ordering of this product is not available nothing remains ${product.quantity} product.`, 404));
    };

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

    checkProductQuantityAndPrica(cart);
    checkProductIfDeletedOrVariable(cart);
    await cart.save();

    if (!product) {
      return next(new ApiError(`No product for this id ${productId}`, 404));
    };
    if (product.quantity <= 0) {
      return next(new ApiError(`Sorry, this product is currently no longer available.`, 404));
    };
    if (product.quantity < quantity) {
      return next(new ApiError(`Sorry, the quantity you are ordering of this product is not available nothing remains ${product.quantity} product.`, 404));
    };

    const productIndex = cart.cartItems.findIndex(
      (item) => item.product._id.toString() === productId
    );
    if (productIndex > -1) {
      const cartItem = cart.cartItems[productIndex];
      cartItem.quantity = quantity || 1;
      cart.cartItems[productIndex] = cartItem;
    } else {
      cart.cartItems.push({ 
        product: productId,
        quantity, color: product.color,
        price: product.priceAfterDiscount || product.price
      });
    };

  };

  checkProductIfDeletedOrVariable(cart);
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

  let cart = await cartModel.findOne({ user: req.user._id });
  if (!cart) {
    return next(
      new ApiError(`No shopping cart for this user id ${req.user._id}.`, 404)
    );
  };

  checkProductQuantityAndPrica(cart);
  checkProductIfDeletedOrVariable(cart);
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

  checkProductQuantityAndPrica(cart);
  checkProductIfDeletedOrVariable(cart);
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
  
  checkProductQuantityAndPrica(cart);
  checkProductIfDeletedOrVariable(cart);
  await cart.save();

  const itemIndex = cart.cartItems.findIndex(
    (item) => item._id.toString() === productId
  );

  if (itemIndex > -1) {
    const product = await productModel.findById(
      cart.cartItems[itemIndex].product
    );
    if (product.quantity < quantity) {
      return next(new ApiError(`Sorry, the quantity you are ordering of this product is not available nothing remains ${product.quantity} product.`, 404));
    };
    const cartItem = cart.cartItems[itemIndex];
    cartItem.quantity = quantity;
    cart.cartItems[itemIndex] = cartItem;
    checkProductIfDeletedOrVariable(cart);
    await cart.save();
  };

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

  checkProductQuantityAndPrica(cart);
  checkProductIfDeletedOrVariable(cart);

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