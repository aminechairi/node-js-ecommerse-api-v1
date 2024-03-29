const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiErrore');
const stripe = require('stripe')(`${process.env.STRIPE_SECRET_KEY}`);

const {
  getAll,
} = require('./handlersFactory');
const productModel = require('../models/productModel');
const cartModel = require('../models/cartModel');
const orderModel = require('../models/orderModel');
const userModel = require('../models/userModel');
const {
  checkProductsIfDeletedOrVariable,
  calcTotalCartPrice
} = require("../utils/shoppingCartProcessing");

// @desc    Logget user create cash order
// @route   POST /api/v1/orders/cartId
// @access  Pravite
exports.loggedUserCreateCashOrder = asyncHandler(async (req, res, next) => {

  const cartId = req.params.cartId;

  const cart = await cartModel.findById(cartId);

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
    await calcTotalCartPrice(cart);
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

    const bulkOption = cart.cartItems.map((item) => {

      const product = item.product;

      if (!(product.price === undefined) && !(product.quantity === undefined) && product.sizes.length === 0) {

        return ({
          updateOne: {
            filter: { _id: item.product },
            update: { $inc: { quantity: -item.quantity, sold: +item.quantity } },
          }});

      } else if (product.price === undefined && product.quantity === undefined &&  product.sizes.length > 0) {
      
        return ({
          updateOne: {
            filter: { _id: item.product, "sizes.size": item.size },
            update: {
              $inc: {
                "sizes.$.quantity": -item.quantity,
                sold: +item.quantity, // Assuming 'sold' is a top-level field in your document
              },
            },
          }});
  
      };
    
    });
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

  const id = req.params.id;
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

  const cart = await cartModel.findById(cartId);
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
    await calcTotalCartPrice(cart);
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
    metadata: req.body.shippingAddress,
  });

  // send session to response
  res.status(200).json({ status: 'success', session });

});

// @desc    This webhook will run when stripe payment success paid
// @route   POST /webhook-checkout
// @access  Pravite /user/manager/admin => acsees rout with <=
exports.webhookCheckout = asyncHandler(async (req, res, next) => {

  const sig = req.headers['stripe-signature'];
  let event;

  try {

    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET_KEY);

  } catch (err) {

    return next(
      new ApiError(`Webhook Error: ${err.message}`, 400)
    );

  };

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':

      const session =  event.data.object;
      const cartId = session.client_reference_id;
      const userEmail = session.customer_email;
      const shippingAddress = session.metadata;
  
      // get shipping cart
      const cart = await cartModel.findById(cartId);

      // get user
      const user = await userModel.findOne({ email: userEmail });

      // Create order with card
      const order = await orderModel.create({
        user: user._id,
        cartItems: cart.cartItems,
        shippingAddress: shippingAddress,
        taxPrice: cart.taxPrice,
        shippingPrice: cart.shippingPrice,
        totalPrice: cart.totalPrice,
        couponName: cart.couponName,
        couponDiscount: cart.couponDiscount,
        totalPriceAfterDiscount: cart.totalPriceAfterDiscount,
        paymentMethodType: 'card',
        isPaid: true,
        paidAt: Date.now(),
      });

      // After creating order, decrement product quantity, increment product sold
      if (order) {

        const bulkOption = cart.cartItems.map((item) => {

          const product = item.product;
    
          if (!(product.price === undefined) && !(product.quantity === undefined) && product.sizes.length === 0) {
    
            return ({
              updateOne: {
                filter: { _id: item.product },
                update: { $inc: { quantity: -item.quantity, sold: +item.quantity } },
              }});
    
          } else if (product.price === undefined && product.quantity === undefined &&  product.sizes.length > 0) {
          
            return ({
              updateOne: {
                filter: { _id: item.product, "sizes.size": item.size },
                update: {
                  $inc: {
                    "sizes.$.quantity": -item.quantity,
                    sold: +item.quantity, // Assuming 'sold' is a top-level field in your document
                  },
                },
              }});
      
          };
        
        });
        await productModel.bulkWrite(bulkOption, {});

        // Clear cart depend on cartId
        await cartModel.findByIdAndDelete(cartId);

      };
      break;
    // ... handle other event types
    default:

      return next(new ApiError(`Unhandled event type ${event.type}`, 400));

  };

  res.status(200).json({
    status: 'success',
    message: `The order was completed successfully.`,
    received: true
  });

});