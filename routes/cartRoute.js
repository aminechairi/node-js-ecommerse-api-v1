const express = require(`express`);

const {
  loggedUserAddProductValidator,
  loggedUserRemoveProductValidator,
  loggedUserUpdateProductQuantityValidator
} = require("../utils/validators/cartValidator")
const {
  loggedUserAddProduct,
  loggedUserGetCart,
  loggedUserRemoveProduct,
  loggedUserClearCart,
  loggedUserUpdateProductQuantity,
  loggedUserApplyCoupon
} = require("../services/cartService");
const protect_allowedTo = require("../services/authServises/protect&allowedTo");

const router = express.Router();

router.use(
  protect_allowedTo.protect(),
  protect_allowedTo.allowedTo("user"),
)

router
  .route("/")
  .get(
    loggedUserGetCart
  ).post(
    loggedUserAddProductValidator,
    loggedUserAddProduct
  ).delete(
    loggedUserClearCart
  );

router
  .route("/applycoupon")
  .put(
    loggedUserApplyCoupon
  );

router
  .route("/:productId")
  .delete(
    loggedUserRemoveProductValidator,
    loggedUserRemoveProduct
  ).put(
    loggedUserUpdateProductQuantityValidator,
    loggedUserUpdateProductQuantity
  );

module.exports = router;