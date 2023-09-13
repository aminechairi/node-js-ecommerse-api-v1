const express = require(`express`);

const {
  addProductToWishlistValidator,
  removeProductFromWishlisttValidator,
} = require("../utils/validators/wishlistValidator");

const {
  addProductToWishlist,
  removeProductFromWishlist,
  getLoggedUserWishlist,
} = require("../services/wishlistService");
const protect_allowedTo = require("../services/authServises/protect&allowedTo");

const router = express.Router();

router.use(
  protect_allowedTo.protect(),
  protect_allowedTo.allowedTo("user"),
);

router
  .route("/")
  .get(
    getLoggedUserWishlist
  )
  .post(
    addProductToWishlistValidator,
    addProductToWishlist
  );

router
  .route("/:productId")
  .delete(
    removeProductFromWishlisttValidator,
    removeProductFromWishlist
  );

module.exports = router;