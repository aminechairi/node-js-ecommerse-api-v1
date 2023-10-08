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
    metadata: req.body.shippingAddress,
  });
  // send session to response
  res.status(200).json({ status: 'success', session });
});

// @desc    This webhook will run when stripe payment success paid
// @route   POST /webhook-checkout
// @access  Pravite
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
      // // Create order with card
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
        const bulkOption = cart.cartItems.map((item) => ({
          updateOne: {
            filter: { _id: item.product },
            update: { $inc: { quantity: -item.quantity, sold: +item.quantity } },
          },
        }));
        await productModel.bulkWrite(bulkOption, {});
        // Clear cart depend on cartId
        await cartModel.findByIdAndDelete(cartId);
      };
      break;
    // ... handle other event types
    default:
      return next(
        new ApiError(`Unhandled event type ${event.type}`, 400)
      );
  };
  res.status(200).json({
    status: 'success',
    message: `The order was completed successfully.`,
    received: true
  });
});

exports.webhooksTest = asyncHandler(async (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, "whsec_YIbWNx4orq0rrBS9TcuLpZd7Ma5MngQm ");
  } catch (err) {
    return next(
      new ApiError(`Webhook Error: ${err.message}`, 400)
    );
  };
  // Handle the event
  switch (event.type) {
    case 'account.updated':
      const accountUpdated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event account.updated
      break;
    case 'account.external_account.created':
      const accountExternalAccountCreated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event account.external_account.created
      break;
    case 'account.external_account.deleted':
      const accountExternalAccountDeleted = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event account.external_account.deleted
      break;
    case 'account.external_account.updated':
      const accountExternalAccountUpdated = s.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event account.external_account.updated
      break;
    case 'balance.available':
      const balanceAvailable = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event balance.available
      break;
    case 'billing_portal.configuration.created':
      const billingPortalConfigurationCreated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event billing_portal.configuration.created
      break;
    case 'billing_portal.configuration.updated':
      const billingPortalConfigurationUpdated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event billing_portal.configuration.updated
      break;
    case 'billing_portal.session.created':
      const billingPortalSessionCreated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event billing_portal.session.created
      break;
    case 'capability.updated':
      const capabilityUpdated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event capability.updated
      break;
    case 'cash_balance.funds_available':
      const cashBalanceFundsAvailable = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event cash_balance.funds_available
      break;
    case 'charge.captured':
      const chargeCaptured = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event charge.captured
      break;
    case 'charge.expired':
      const chargeExpired = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event charge.expired
      break;
    case 'charge.failed':
      const chargeFailed = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event charge.failed
      break;
    case 'charge.pending':
      const chargePending = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event charge.pending
      break;
    case 'charge.refunded':
      const chargeRefunded = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event charge.refunded
      break;
    case 'charge.succeeded':
      const chargeSucceeded = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event charge.succeeded
      break;
    case 'charge.updated':
      const chargeUpdated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event charge.updated
      break;
    case 'charge.dispute.closed':
      const chargeDisputeClosed = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event charge.dispute.closed
      break;
    case 'charge.dispute.created':
      const chargeDisputeCreated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event charge.dispute.created
      break;
    case 'charge.dispute.funds_reinstated':
      const chargeDisputeFundsReinstated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event charge.dispute.funds_reinstated
      break;
    case 'charge.dispute.funds_withdrawn':
      const chargeDisputeFundsWithdrawn = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event charge.dispute.funds_withdrawn
      break;
    case 'charge.dispute.updated':
      const chargeDisputeUpdated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event charge.dispute.updated
      break;
    case 'charge.refund.updated':
      const chargeRefundUpdated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event charge.refund.updated
      break;
    case 'checkout.session.async_payment_failed':
      const checkoutSessionAsyncPaymentFailed = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event checkout.session.async_payment_failed
      break;
    case 'checkout.session.async_payment_succeeded':
      const checkoutSessionAsyncPaymentSucceeded = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event checkout.session.async_payment_succeeded
      break;
    case 'checkout.session.completed':
      const checkoutSessionCompleted = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event checkout.session.completed
      break;
    case 'checkout.session.expired':
      const checkoutSessionExpired = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event checkout.session.expired
      break;
    case 'coupon.created':
      const couponCreated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event coupon.created
      break;
    case 'coupon.deleted':
      const couponDeleted = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event coupon.deleted
      break;
    case 'coupon.updated':
      const couponUpdated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event coupon.updated
      break;
    case 'credit_note.created':
      const creditNoteCreated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event credit_note.created
      break;
    case 'credit_note.updated':
      const creditNoteUpdated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event credit_note.updated
      break;
    case 'credit_note.voided':
      const creditNoteVoided = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event credit_note.voided
      break;
    case 'customer.created':
      const customerCreated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event customer.created
      break;
    case 'customer.deleted':
      const customerDeleted = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event customer.deleted
      break;
    case 'customer.updated':
      const customerUpdated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event customer.updated
      break;
    case 'customer.discount.created':
      const customerDiscountCreated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event customer.discount.created
      break;
    case 'customer.discount.deleted':
      const customerDiscountDeleted = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event customer.discount.deleted
      break;
    case 'customer.discount.updated':
      const customerDiscountUpdated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event customer.discount.updated
      break;
    case 'customer.source.created':
      const customerSourceCreated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event customer.source.created
      break;
    case 'customer.source.deleted':
      const customerSourceDeleted = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event customer.source.deleted
      break;
    case 'customer.source.expiring':
      const customerSourceExpiring = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event customer.source.expiring
      break;
    case 'customer.source.updated':
      const customerSourceUpdated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event customer.source.updated
      break;
    case 'customer.subscription.created':
      const customerSubscriptionCreated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event customer.subscription.created
      break;
    case 'customer.subscription.deleted':
      const customerSubscriptionDeleted = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event customer.subscription.deleted
      break;
    case 'customer.subscription.paused':
      const customerSubscriptionPaused = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event customer.subscription.paused
      break;
    case 'customer.subscription.pending_update_applied':
      const customerSubscriptionPendingUpdateApplied = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event customer.subscription.pending_update_applied
      break;
    case 'customer.subscription.pending_update_expired':
      const customerSubscriptionPendingUpdateExpired = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event customer.subscription.pending_update_expired
      break;
    case 'customer.subscription.resumed':
      const customerSubscriptionResumed = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event customer.subscription.resumed
      break;
    case 'customer.subscription.trial_will_end':
      const customerSubscriptionTrialWillEnd = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event customer.subscription.trial_will_end
      break;
    case 'customer.subscription.updated':
      const customerSubscriptionUpdated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event customer.subscription.updated
      break;
    case 'customer.tax_id.created':
      const customerTaxIdCreated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event customer.tax_id.created
      break;
    case 'customer.tax_id.deleted':
      const customerTaxIdDeleted = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event customer.tax_id.deleted
      break;
    case 'customer.tax_id.updated':
      const customerTaxIdUpdated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event customer.tax_id.updated
      break;
    case 'customer_cash_balance_transaction.created':
      const customerCashBalanceTransactionCreated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event customer_cash_balance_transaction.created
      break;
    case 'file.created':
      const fileCreated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event file.created
      break;
    case 'financial_connections.account.created':
      const financialConnectionsAccountCreated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event financial_connections.account.created
      break;
    case 'financial_connections.account.deactivated':
      const financialConnectionsAccountDeactivated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event financial_connections.account.deactivated
      break;
    case 'financial_connections.account.disconnected':
      const financialConnectionsAccountDisconnected = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event financial_connections.account.disconnected
      break;
    case 'financial_connections.account.reactivated':
      const financialConnectionsAccountReactivated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event financial_connections.account.reactivated
      break;
    case 'financial_connections.account.refreshed_balance':
      const financialConnectionsAccountRefreshedBalance = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event financial_connections.account.refreshed_balance
      break;
    case 'identity.verification_session.canceled':
      const identityVerificationSessionCanceled = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event identity.verification_session.canceled
      break;
    case 'identity.verification_session.created':
      const identityVerificationSessionCreated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event identity.verification_session.created
      break;
    case 'identity.verification_session.processing':
      const identityVerificationSessionProcessing = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event identity.verification_session.processing
      break;
    case 'identity.verification_session.requires_input':
      const identityVerificationSessionRequiresInput = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event identity.verification_session.requires_input
      break;
    case 'identity.verification_session.verified':
      const identityVerificationSessionVerified = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event identity.verification_session.verified
      break;
    case 'invoice.created':
      const invoiceCreated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event invoice.created
      break;
    case 'invoice.deleted':
      const invoiceDeleted = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event invoice.deleted
      break;
    case 'invoice.finalization_failed':
      const invoiceFinalizationFailed = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event invoice.finalization_failed
      break;
    case 'invoice.finalized':
      const invoiceFinalized = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event invoice.finalized
      break;
    case 'invoice.marked_uncollectible':
      const invoiceMarkedUncollectible = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event invoice.marked_uncollectible
      break;
    case 'invoice.paid':
      const invoicePaid = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event invoice.paid
      break;
    case 'invoice.payment_action_required':
      const invoicePaymentActionRequired = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event invoice.payment_action_required
      break;
    case 'invoice.payment_failed':
      const invoicePaymentFailed = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event invoice.payment_failed
      break;
    case 'invoice.payment_succeeded':
      const invoicePaymentSucceeded = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event invoice.payment_succeeded
      break;
    case 'invoice.sent':
      const invoiceSent = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event invoice.sent
      break;
    case 'invoice.upcoming':
      const invoiceUpcoming = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event invoice.upcoming
      break;
    case 'invoice.updated':
      const invoiceUpdated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event invoice.updated
      break;
    case 'invoice.voided':
      const invoiceVoided = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event invoice.voided
      break;
    case 'invoiceitem.created':
      const invoiceitemCreated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event invoiceitem.created
      break;
    case 'invoiceitem.deleted':
      const invoiceitemDeleted = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event invoiceitem.deleted
      break;
    case 'issuing_authorization.created':
      const issuingAuthorizationCreated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event issuing_authorization.created
      break;
    case 'issuing_authorization.updated':
      const issuingAuthorizationUpdated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event issuing_authorization.updated
      break;
    case 'issuing_card.created':
      const issuingCardCreated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event issuing_card.created
      break;
    case 'issuing_card.updated':
      const issuingCardUpdated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event issuing_card.updated
      break;
    case 'issuing_cardholder.created':
      const issuingCardholderCreated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event issuing_cardholder.created
      break;
    case 'issuing_cardholder.updated':
      const issuingCardholderUpdated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event issuing_cardholder.updated
      break;
    case 'issuing_dispute.closed':
      const issuingDisputeClosed = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event issuing_dispute.closed
      break;
    case 'issuing_dispute.created':
      const issuingDisputeCreated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event issuing_dispute.created
      break;
    case 'issuing_dispute.funds_reinstated':
      const issuingDisputeFundsReinstated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event issuing_dispute.funds_reinstated
      break;
    case 'issuing_dispute.submitted':
      const issuingDisputeSubmitted = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event issuing_dispute.submitted
      break;
    case 'issuing_dispute.updated':
      const issuingDisputeUpdated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event issuing_dispute.updated
      break;
    case 'issuing_transaction.created':
      const issuingTransactionCreated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event issuing_transaction.created
      break;
    case 'issuing_transaction.updated':
      const issuingTransactionUpdated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event issuing_transaction.updated
      break;
    case 'mandate.updated':
      const mandateUpdated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event mandate.updated
      break;
    case 'payment_intent.amount_capturable_updated':
      const paymentIntentAmountCapturableUpdated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event payment_intent.amount_capturable_updated
      break;
    case 'payment_intent.canceled':
      const paymentIntentCanceled = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event payment_intent.canceled
      break;
    case 'payment_intent.created':
      const paymentIntentCreated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event payment_intent.created
      break;
    case 'payment_intent.partially_funded':
      const paymentIntentPartiallyFunded = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event payment_intent.partially_funded
      break;
    case 'payment_intent.payment_failed':
      const paymentIntentPaymentFailed = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event payment_intent.payment_failed
      break;
    case 'payment_intent.processing':
      const paymentIntentProcessing = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event payment_intent.processing
      break;
    case 'payment_intent.requires_action':
      const paymentIntentRequiresAction = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event payment_intent.requires_action
      break;
    case 'payment_intent.succeeded':
      const paymentIntentSucceeded = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event payment_intent.succeeded
      break;
    case 'payment_link.created':
      const paymentLinkCreated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event payment_link.created
      break;
    case 'payment_link.updated':
      const paymentLinkUpdated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event payment_link.updated
      break;
    case 'payment_method.attached':
      const paymentMethodAttached = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event payment_method.attached
      break;
    case 'payment_method.automatically_updated':
      const paymentMethodAutomaticallyUpdated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event payment_method.automatically_updated
      break;
    case 'payment_method.detached':
      const paymentMethodDetached = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event payment_method.detached
      break;
    case 'payment_method.updated':
      const paymentMethodUpdated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event payment_method.updated
      break;
    case 'payout.canceled':
      const payoutCanceled = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event payout.canceled
      break;
    case 'payout.created':
      const payoutCreated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event payout.created
      break;
    case 'payout.failed':
      const payoutFailed = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event payout.failed
      break;
    case 'payout.paid':
      const payoutPaid = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event payout.paid
      break;
    case 'payout.reconciliation_completed':
      const payoutReconciliationCompleted = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event payout.reconciliation_completed
      break;
    case 'payout.updated':
      const payoutUpdated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event payout.updated
      break;
    case 'person.created':
      const personCreated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event person.created
      break;
    case 'person.deleted':
      const personDeleted = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event person.deleted
      break;
    case 'person.updated':
      const personUpdated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event person.updated
      break;
    case 'plan.created':
      const planCreated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event plan.created
      break;
    case 'plan.deleted':
      const planDeleted = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event plan.deleted
      break;
    case 'plan.updated':
      const planUpdated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event plan.updated
      break;
    case 'price.created':
      const priceCreated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event price.created
      break;
    case 'price.deleted':
      const priceDeleted = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event price.deleted
      break;
    case 'price.updated':
      const priceUpdated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event price.updated
      break;
    case 'product.created':
      const productCreated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event product.created
      break;
    case 'product.deleted':
      const productDeleted = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event product.deleted
      break;
    case 'product.updated':
      const productUpdated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event product.updated
      break;
    case 'promotion_code.created':
      const promotionCodeCreated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event promotion_code.created
      break;
    case 'promotion_code.updated':
      const promotionCodeUpdated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event promotion_code.updated
      break;
    case 'quote.accepted':
      const quoteAccepted = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event quote.accepted
      break;
    case 'quote.canceled':
      const quoteCanceled = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event quote.canceled
      break;
    case 'quote.created':
      const quoteCreated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event quote.created
      break;
    case 'quote.finalized':
      const quoteFinalized = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event quote.finalized
      break;
    case 'radar.early_fraud_warning.created':
      const radarEarlyFraudWarningCreated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event radar.early_fraud_warning.created
      break;
    case 'radar.early_fraud_warning.updated':
      const radarEarlyFraudWarningUpdated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event radar.early_fraud_warning.updated
      break;
    case 'refund.created':
      const refundCreated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event refund.created
      break;
    case 'refund.updated':
      const refundUpdated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event refund.updated
      break;
    case 'reporting.report_run.failed':
      const reportingReportRunFailed = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event reporting.report_run.failed
      break;
    case 'reporting.report_run.succeeded':
      const reportingReportRunSucceeded = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event reporting.report_run.succeeded
      break;
    case 'review.closed':
      const reviewClosed = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event review.closed
      break;
    case 'review.opened':
      const reviewOpened = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event review.opened
      break;
    case 'setup_intent.canceled':
      const setupIntentCanceled = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event setup_intent.canceled
      break;
    case 'setup_intent.created':
      const setupIntentCreated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event setup_intent.created
      break;
    case 'setup_intent.requires_action':
      const setupIntentRequiresAction = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event setup_intent.requires_action
      break;
    case 'setup_intent.setup_failed':
      const setupIntentSetupFailed = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event setup_intent.setup_failed
      break;
    case 'setup_intent.succeeded':
      const setupIntentSucceeded = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event setup_intent.succeeded
      break;
    case 'sigma.scheduled_query_run.created':
      const sigmaScheduledQueryRunCreated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event sigma.scheduled_query_run.created
      break;
    case 'source.canceled':
      const sourceCanceled = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event source.canceled
      break;
    case 'source.chargeable':
      const sourceChargeable = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event source.chargeable
      break;
    case 'source.failed':
      const sourceFailed = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event source.failed
      break;
    case 'source.mandate_notification':
      const sourceMandateNotification = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event source.mandate_notification
      break;
    case 'source.refund_attributes_required':
      const sourceRefundAttributesRequired = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event source.refund_attributes_required
      break;
    case 'source.transaction.created':
      const sourceTransactionCreated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event source.transaction.created
      break;
    case 'source.transaction.updated':
      const sourceTransactionUpdated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event source.transaction.updated
      break;
    case 'subscription_schedule.aborted':
      const subscriptionScheduleAborted = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event subscription_schedule.aborted
      break;
    case 'subscription_schedule.canceled':
      const subscriptionScheduleCanceled = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event subscription_schedule.canceled
      break;
    case 'subscription_schedule.completed':
      const subscriptionScheduleCompleted = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event subscription_schedule.completed
      break;
    case 'subscription_schedule.created':
      const subscriptionScheduleCreated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event subscription_schedule.created
      break;
    case 'subscription_schedule.expiring':
      const subscriptionScheduleExpiring = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event subscription_schedule.expiring
      break;
    case 'subscription_schedule.released':
      const subscriptionScheduleReleased = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event subscription_schedule.released
      break;
    case 'subscription_schedule.updated':
      const subscriptionScheduleUpdated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event subscription_schedule.updated
      break;
    case 'tax.settings.updated':
      const taxSettingsUpdated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event tax.settings.updated
      break;
    case 'tax_rate.created':
      const taxRateCreated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event tax_rate.created
      break;
    case 'tax_rate.updated':
      const taxRateUpdated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event tax_rate.updated
      break;
    case 'terminal.reader.action_failed':
      const terminalReaderActionFailed = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event terminal.reader.action_failed
      break;
    case 'terminal.reader.action_succeeded':
      const terminalReaderActionSucceeded = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event terminal.reader.action_succeeded
      break;
    case 'test_helpers.test_clock.advancing':
      const testHelpersTestClockAdvancing = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event test_helpers.test_clock.advancing
      break;
    case 'test_helpers.test_clock.created':
      const testHelpersTestClockCreated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event test_helpers.test_clock.created
      break;
    case 'test_helpers.test_clock.deleted':
      const testHelpersTestClockDeleted = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event test_helpers.test_clock.deleted
      break;
    case 'test_helpers.test_clock.internal_failure':
      const testHelpersTestClockInternalFailure = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event test_helpers.test_clock.internal_failure
      break;
    case 'test_helpers.test_clock.ready':
      const testHelpersTestClockReady = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event test_helpers.test_clock.ready
      break;
    case 'topup.canceled':
      const topupCanceled = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event topup.canceled
      break;
    case 'topup.created':
      const topupCreated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event topup.created
      break;
    case 'topup.failed':
      const topupFailed = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event topup.failed
      break;
    case 'topup.reversed':
      const topupReversed = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event topup.reversed
      break;
    case 'topup.succeeded':
      const topupSucceeded = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event topup.succeeded
      break;
    case 'transfer.created':
      const transferCreated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event transfer.created
      break;
    case 'transfer.reversed':
      const transferReversed = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event transfer.reversed
      break;
    case 'transfer.updated':
      const transferUpdated = event.data.object;
      console.log(event.type);
      // Then define and call a function to handle the event transfer.updated
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
  res.status(200).json({
    received: true
  });
});