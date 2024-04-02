const appSettingsModel = require("../models/appSettingsModel")

// Check products if deleted or variable
exports.checkProductsIfDeletedOrVariable = (cart) => {

  // Check if product deleted
  const cartItems = cart.cartItems.filter(
    item => !(item.product === null)
  )
  // Check the product quantity if it is equal than 0
  .filter((item) => {
  
    const product = item.product;
  
    if (!(product.price === undefined) && !(product.quantity === undefined) && product.sizes.length === 0) {
  
      return item.product.quantity > 0
  
    } else if (product.price === undefined && product.quantity === undefined &&  product.sizes.length > 0) {
  
      const sizesItem = item.product.sizes.filter((el) => {
        return el.size === item.size;
      });
  
      if (sizesItem.length > 0) {
    
        if (sizesItem[0].quantity > 0) {
          return item
        };

      };
      
    };
  
  });
  // Check the quantity of the product ordered by the user if it is still available.
  cartItems.forEach((item) => {
  
    const product = item.product;
  
    if (!(product.price === undefined) && !(product.quantity === undefined) && product.sizes.length === 0) {
  
      if ( item.product.quantity < item.quantity) {
        item.quantity = item.product.quantity;
      };
  
    } else if (product.price === undefined && product.quantity === undefined &&  product.sizes.length > 0) {
  
      const sizesItem = item.product.sizes.filter((el) => {
        return el.size === item.size;
      });
  
      if (sizesItem[0].quantity < item.quantity) {
        item.quantity = sizesItem[0].quantity;
      };
  
    };
  
  });
  // Check product price if variable
  cartItems.forEach((item) => {

    const product = item.product;
  
  if (!(product.price === undefined) && !(product.quantity === undefined) && product.sizes.length === 0) {
  
      item.price = item.product.priceAfterDiscount || item.product.price
  
  } else if (product.price === undefined && product.quantity === undefined &&  product.sizes.length > 0) {
  
      const sizesItem = item.product.sizes.filter((el) => {
        return el.size === item.size;
      });
  
      item.price = sizesItem[0].priceAfterDiscount || sizesItem[0].price;
  
    };
  
  })

  cart.cartItems = cartItems;

};

// Calc total cart price
exports.calcTotalCartPrice = async (cart) => {

  // Get app settings
  const appSettings = await appSettingsModel.findOne({}) || {};
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