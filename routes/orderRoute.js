const express = require(`express`);

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
    getOrder
  );

router
  .route("/:id/paid")
  .put(
    protect_allowedTo.protect(),
    protect_allowedTo.allowedTo("admin"),
    updateOrderPaid
  );

  router
  .route("/:id/delivered")
  .put(
    protect_allowedTo.protect(),
    protect_allowedTo.allowedTo("admin"),
    updateOrderDelivered
  );

  router.get(
    '/checkout-session/:cartId',
    protect_allowedTo.protect(),
    protect_allowedTo.allowedTo("user"),
    checkoutSession,
  );
  
module.exports = router;