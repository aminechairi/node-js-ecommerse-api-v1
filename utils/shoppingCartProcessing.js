const appSettingsModel = require("../models/appSettingsModel");

// Function to filter out cart items where the product has been deleted (i.e., product is null)
exports.filterDeletedCartItems = (cartItems) => {
  return cartItems.filter((item) => item.product !== null);
}

// Remove products that have been updated after being added to the cart.
const removeRecentlyUpdatedProducts = (cart) => {
  cart.cartItems = cart.cartItems.filter((item) => {
    const itemCreatedAt = new Date(item.createdAt); // Get the timestamp when the item was added to the cart
    const productUpdatedAt =
      item.product && item.product.updatedAt
        ? new Date(item.product.updatedAt)
        : null; // Get the timestamp when the product was last updated

    // If productUpdatedAt is null, it means the item is just an ID, so we keep it.
    if (!productUpdatedAt) {
      return true;
    }

    // Keep the item if its product was not updated after the item was added to the cart
    return productUpdatedAt <= itemCreatedAt;
  });

  return cart; // Return the updated cart
};

exports.calcTotalCartPrice = async (cart) => {
  cart = removeRecentlyUpdatedProducts(cart);

  // Check if there are items in the cart
  if (cart.cartItems?.length > 0) {
    // Fetch app settings or provide default values
    const { taxPrice = 0, shippingPrice = 0 } =
      (await appSettingsModel.findOne({})) || {};

    // Calculate total price for items in the cart
    let totalPrice = cart.cartItems.reduce((total, item) => {
      const itemTotal = item.price * item.quantity;
      item.totalPrice = parseFloat(itemTotal.toFixed(2)); // Ensure it's stored as a number, not a string
      return total + itemTotal;
    }, 0);

    // Add tax and shipping prices
    cart.taxPrice = taxPrice;
    cart.shippingPrice = shippingPrice;
    totalPrice += taxPrice + shippingPrice;

    cart.totalPrice = parseFloat(totalPrice.toFixed(2));

    // Apply discount if a coupon is used
    if (cart.couponName && cart.couponDiscount) {
      const discountAmount = (totalPrice * cart.couponDiscount) / 100;
      cart.totalPriceAfterDiscount = parseFloat(
        (totalPrice - discountAmount).toFixed(2)
      );
    }
  } else {
    // No items in the cart, reset prices
    cart.taxPrice = 0;
    cart.shippingPrice = 0;
    cart.totalPrice = 0;
    cart.couponName = undefined;
    cart.couponDiscount = undefined;
    cart.totalPriceAfterDiscount = undefined;
  }

  // Save the updated cart object
  await cart.save();
};
