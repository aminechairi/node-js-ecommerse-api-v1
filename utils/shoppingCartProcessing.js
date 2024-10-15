const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

const appSettingsModel = require("../models/appSettingsModel");

/**
 * Filters and updates the cart items to ensure that products are valid.
 *
 * - Removes items from the cart if their corresponding product has been deleted.
 * - Updates the item's color if it has changed in the product.
 * - Removes items if the price or size of the product no longer matches the cart's item details.
 *
 * @param {Array} cartItems - An array of items in the cart, where each item contains a product, price, size, and color.
 * @returns {Array} - A filtered array of valid cart items with updated color, if applicable.
 */
const filterValidCartItems = (cartItems) => {
  return cartItems.filter((item) => {
    // If the product no longer exists (e.g., deleted), remove the item
    if (!item.product) return false;

    // If the product is referenced by an ObjectId, assume it's valid
    if (item.product instanceof ObjectId) {
      return true;
    }

    // If the product is an object, check for changes in color, size, and price
    if (typeof item.product === "object" && item.product !== null) {
      // Update the item's color if it exists and has changed
      if (
        item.color &&
        item.product.color &&
        item.color !== item.product.color
      ) {
        item.color = item.product.color;
      }

      // Check size and price, or just price if no size is provided
      if (item.size && item.price) {
        // If both size and price are present, check for a matching size and price
        return item.product.sizes.find(
          (size) =>
            `${size.size}`.toUpperCase() === `${item.size}`.toUpperCase() &&
            size.price === item.price
        );
      } else {
        // If no size, just compare the price
        return item.price === item.product.price;
      }
    }

    // If the product does not match any valid conditions, remove the item
    return false;
  });
};

exports.calcTotalCartPrice = async (cart) => {
  cart.cartItems = filterValidCartItems(cart.cartItems);

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
