const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiErrore');
const stripe = require('stripe')(`${process.env.STRIPE_SECRET_KEY}`);

const {
  getAll,
} = require('./handlersFactory');
const productModel = require('../models/productModel');
const cartModel = require('../models/cartModel');
const orderModel = require('../models/orderModel');
const {
  checkProductsIfDeletedOrVariable,
  calcTotalCartPrice
} = require("../utils/shoppingCartProcessing");

// @desc    Logget user create cash order
// @route   POST /api/v1/orders/cartId
// @access  Pravite
exports.loggedUserCreateCashOrder = asyncHandler(async (req, res, next) => {
  const cartId = req.params.cartId;
  // Get shopping cart depend on cartId
  const cart = await cartModel.findById(cartId);
  // Check shopping cart if available
  if (!cart) {
    return next(
      new ApiError(`No cart for this id ${cartId}.`, 404)
    );
  };
  // Save old shopping cart
  const oldCart = JSON.stringify(cart);
  // Check products if deleted or variable
  checkProductsIfDeletedOrVariable(cart);
  // Save new shopping cart
  const newCart = JSON.stringify(cart);
  // Comparison between old shopping cart and new shopping cart
  if (oldCart !== newCart) {
    // Calc total cart price 
    calcTotalCartPrice(cart);
    await cart.save();
    return next(
      new ApiError(`Sorry, the products you added to your cart are no longer available as requested.`, 404)
    );
  };
  // Check shopping cart if varegh
  if (cart.cartItems.length === 0) {
    return next(
      new ApiError(`This oredr is not valid.`, 401)
    );
  };
  // Create order with default paymentMethodType cash
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
  // After creating order, decrement product quantity, increment product sold
  if (order) {
    const bulkOption = cart.cartItems.map((item) => ({
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { quantity: -item.quantity, sold: +item.quantity } },
      },
    }));
    await productModel.bulkWrite(bulkOption, {});
    // 5) Clear cart depend on cartId
    await cartModel.findByIdAndDelete(cartId);
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

// @desc    Get checkout session from stripe and send it as response
// @route   GET /api/v1/orders/checkout-session/cartId
// @access  Pravite
exports.checkoutSession = asyncHandler(async (req, res, next) => {
  const cartId = req.params.cartId;
  // Get shopping cart depend on cartId
  const cart = await cartModel.findById(cartId);
  // Check shopping cart if available
  if (!cart) {
    return next(
      new ApiError(`No cart for this id ${cartId}.`, 404)
    );
  };
  // Save old shopping cart
  const oldCart = JSON.stringify(cart);
  // Check products if deleted or variable
  checkProductsIfDeletedOrVariable(cart);
  // Save new shopping cart
  const newCart = JSON.stringify(cart);
  // Comparison between old shopping cart and new shopping cart
  if (oldCart !== newCart) {
    // Calc total cart price 
    calcTotalCartPrice(cart);
    await cart.save();
    return next(
      new ApiError(`Sorry, the products you added to your cart are no longer available as requested.`, 404)
    );
  };
  // Check shopping cart if varegh
  if (cart.cartItems.length === 0) {
    return next(
      new ApiError(`This oredr is not valid.`, 401)
    );
  };
  // Stripe create session
  const price = cart.totalPriceAfterDiscount || cart.totalPrice;
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: price * 100,
          product_data: {
            name: `${req.user.firstName} ${req.user.lastName}`,
          },
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    client_reference_id: req.params.cartId,
    customer_email: req.user.email,
    success_url: `${req.protocol}://${req.get('host')}/api/v1/orders`,
    cancel_url: `${req.protocol}://${req.get('host')}/api/v1/cart`,
  });
  // send session to response
  res.status(200).json({ status: 'success', session });
});

// create order with card
const createOrder = async (session) => {
  console.log(session);
  // const cart = cartModel.findById();

  // // Create order with card
  // const order = await orderModel.create({
  //   user: req.user._id,
  //   cartItems: cart.cartItems,
  //   shippingAddress: req.body.shippingAddress,
  //   taxPrice: cart.taxPrice,
  //   shippingPrice: cart.shippingPrice,
  //   totalPrice: cart.totalPrice,
  //   couponName: cart.couponName,
  //   couponDiscount: cart.couponDiscount,
  //   totalPriceAfterDiscount: cart.totalPriceAfterDiscount,
  // });
  // // After creating order, decrement product quantity, increment product sold
  // if (order) {
  //   const bulkOption = cart.cartItems.map((item) => ({
  //     updateOne: {
  //       filter: { _id: item.product },
  //       update: { $inc: { quantity: -item.quantity, sold: +item.quantity } },
  //     },
  //   }));
  //   await productModel.bulkWrite(bulkOption, {});
  //   // Clear cart depend on cartId
  //   await cartModel.findByIdAndDelete(cartId);
  // };
  // res.status(201).json({
  //   status: 'success',
  //   message: `The order was completed successfully.`,
  //   data: order
  // });
};

// @desc    This webhook will run when stripe payment success paid
// @route   POST /webhook-checkout
// @access  Pravite
exports.webhookCheckout = asyncHandler(async (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET_KEY);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  };
  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const checkoutSessionCompleted = event.data.object;
      // Then define and call a function to handle the event checkout.session.completed
      createOrder(checkoutSessionCompleted);
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  };
  res.status(200).json({ received: true });
});