const express = require(`express`);

const {
  createCashOrder,
  getOrders,
  filterOrderForLoggedUser,
  getOrder,
  updateOrderPaid,
  updateOrderDelivered
} = require("../services/orderServise");
const protect_allowedTo = require("../services/authServises/protect&allowedTo");

const router = express.Router();

router
  .route("/:cartId")
  .post(
    protect_allowedTo.protect(),
    protect_allowedTo.allowedTo("user"),
    createCashOrder
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

module.exports = router;