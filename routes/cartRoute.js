const express = require(`express`);

const {
  addProductToCartValidator,
  applyCouponValidator,
  removeProductFromCartValidator
} = require("../utils/validators/cartValidator")
const {
  addProductToCart,
  getCart,
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
  ).delete(
    clearCartItems
  );

router
  .route("/applycoupon")
  .put(
    applyCouponValidator,
    applyCoupon
  );

router
  .route("/:productId")
  .delete(
    removeProductFromCartValidator,
    removeProductFromCart
  );

module.exports = router;
