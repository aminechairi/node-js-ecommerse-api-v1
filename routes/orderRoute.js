const express = require(`express`);

const {
  loggedUserCreateCashOrderValidator,
  getOrderValidator,
  updateOrderPaidValidator,
  updateOrderDeliveredValidator,
  checkoutSessionValidator
} = require("../utils/validators/orderValidator");

const {
  loggedUserCreateCashOrder,
  getOrders,
  filterOrderForLoggedUser,
  getOrder,
  updateOrderPaid,
  updateOrderDelivered,
  checkoutSession,
} = require("../services/orderServise");
const protect_allowedTo = require("../services/authServises/protect&allowedTo");

const router = express.Router();

router
  .route("/:cartId")
  .post(
    protect_allowedTo.protect(),
    protect_allowedTo.allowedTo("user"),
    loggedUserCreateCashOrderValidator,
    loggedUserCreateCashOrder
  );

router
  .route("/")
  .get(
    protect_allowedTo.protect(),
    protect_allowedTo.allowedTo("admin", "manager", "user"),
    filterOrderForLoggedUser,
    getOrders
  );

router
  .route("/:id")
  .get(
    protect_allowedTo.protect(),
    protect_allowedTo.allowedTo("admin", "manager", "user"),
    getOrderValidator,
    getOrder
  );

router
  .route("/:id/paid")
  .put(
    protect_allowedTo.protect(),
    protect_allowedTo.allowedTo("admin"),
    updateOrderPaidValidator,
    updateOrderPaid
  );

router
  .route("/:id/delivered")
  .put(
    protect_allowedTo.protect(),
    protect_allowedTo.allowedTo("admin"),
    updateOrderDeliveredValidator,
    updateOrderDelivered
  );

router.get(
    '/checkout-session/:cartId',
    protect_allowedTo.protect(),
    protect_allowedTo.allowedTo("user"),
    checkoutSessionValidator,
    checkoutSession,
  );
  
module.exports = router;