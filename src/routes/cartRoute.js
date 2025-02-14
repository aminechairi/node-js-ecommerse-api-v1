const express = require(`express`);

const {
  addProductToCartValidator,
  removeProductFromCartValidator,
  applyCouponValidator
} = require("../utils/validators/cartValidator");

const {
  addProductToCart,
  getCart,
  updateProductQuantityInCart,
  removeProductFromCart,
  clearCartItems,
  applyCoupon
} = require("../services/cartService");

const protect_allowedTo = require("../services/authServises/protect&allowedTo");

const router = express.Router();

router.use(
  protect_allowedTo.protect(),
  protect_allowedTo.allowedTo("user", "manager", "admin"),
)

router
  .route("/")
  .get(
    getCart
  ).post(
    addProductToCartValidator,
    addProductToCart
  ).put(
    addProductToCartValidator, // Because they have the same validations
    updateProductQuantityInCart
  ).delete(
    removeProductFromCartValidator,
    removeProductFromCart
  );

router
  .route("/clearcartitems")
  .delete(
    clearCartItems
  );

router
  .route("/applycoupon")
  .put(
    applyCouponValidator,
    applyCoupon
  );

module.exports = router;
