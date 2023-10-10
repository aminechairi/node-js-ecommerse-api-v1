const appSettingsModel = require("../models/appSettingsModel")

// Check products if deleted or variable
exports.checkProductsIfDeletedOrVariable = (cart) => {
  const cartItems = cart.cartItems.filter((item) => {
    // if product deleted
    if (item.product === null) item.product = { quantity: 0, };
    return item.product.quantity >= 1;
  });
  cartItems.forEach((item) => {
    item.product.quantity < item.quantity 
    ? item.quantity = item.product.quantity
    : item.quantity = item.quantity
    item.price = item.product.priceAfterDiscount || item.product.price
  });
  cart.cartItems = cartItems;
};

// Calc total cart price
exports.calcTotalCartPrice = async (cart) => {
  // Get app settings
  const appSettings = await appSettingsModel.findOne({});
  const taxPrice = appSettings.taxPrice || 0;
  const shippingPrice = appSettings.shippingPrice || 0;
  let totalPrice = 0;
  cart.cartItems.forEach((item) => {
    totalPrice += item.price * item.quantity;
  });
  cart.taxPrice = taxPrice;
  cart.shippingPrice = shippingPrice;
  cart.totalPrice = (totalPrice + taxPrice + shippingPrice).toFixed(2);
  if (cart.couponName) {
    const totalPrice = cart.totalPrice;
    const totalPriceAfterDiscount = (totalPrice - (totalPrice * cart.couponDiscount) / 100).toFixed(2); // 99.23
    cart.totalPriceAfterDiscount = totalPriceAfterDiscount;
  };
};