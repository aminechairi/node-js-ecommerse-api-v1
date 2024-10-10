const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiErrore");

const productModel = require("../models/productModel");
const couponModel = require("../models/couponModel");
const cartModel = require("../models/cartModel");
const {
  calcTotalCartPrice,
  filterDeletedCartItems,
} = require("../utils/shoppingCartProcessing");

const validateProductAvailability = (product, quantity, size) => {
  if (product.sizes.length <= 0) {
    if (product.quantity <= 0) {
      return `Unfortunately, this product is currently out of stock.`;
    }
    if (product.quantity < quantity) {
      return `Unfortunately, the quantity you are trying to order is not available. Only ${product.quantity} product(s) remain in stock.`;
    }
    return null; // Valid product state
  } else if (product.sizes.length > 0) {
    if (!size) {
      return `Please select a product size.`;
    }
    const sizeItem = product.sizes.find(
      (item) => `${item.size}`.toLowerCase() === `${size}`.toLowerCase()
    );

    if (!sizeItem) {
      return `The size you selected is not available.`;
    }
    if (sizeItem.quantity <= 0) {
      return `Unfortunately, this product is currently out of stock.`;
    }
    if (sizeItem.quantity < quantity) {
      return `Unfortunately, the quantity you are trying to order is not available. Only ${sizeItem.quantity} product(s) remain in stock.`;
    }
    return null; // Valid product size state
  }
  return `We're sorry, but this product is not available for purchase.`; // Fallback case
};

// @desc    Logged user add product to his cart.
// @route   POST /api/v1/cart
// @access  Private
exports.addProductToCart = asyncHandler(async (req, res, next) => {
  let { productId, quantity, size } = req.body;

  // Validate product existence
  const product = await productModel.findById(productId);
  if (!product) {
    return next(new ApiError(`No product for this ID: ${productId}.`, 404));
  }

  // Validate product availability
  const availabilityError = validateProductAvailability(
    product,
    quantity,
    size
  );
  if (availabilityError) {
    return next(new ApiError(availabilityError, 404));
  }
  if (product.sizes.length <= 0) size = undefined;

  // Determine the price based on size
  const price =
    product.sizes.length > 0
      ? product.sizes.find(
          (item) => `${item.size}`.toLowerCase() === `${size}`.toLowerCase()
        ).price
      : product.price;

  // Find or create the cart
  let cart =
    (await cartModel.findOne({ user: req.user._id })) ||
    (await cartModel.create({ user: req.user._id, cartItems: [] }));

  // Update the cart to exclude any items with deleted products
  cart.cartItems = filterDeletedCartItems(cart.cartItems);

  // Find the index of the product in the cart if it already exists
  const productIndex = cart.cartItems.findIndex(
    (item) =>
      item.product._id.toString() === productId &&
      `${item.size}`.toLowerCase() === `${size}`.toLowerCase()
  );

  if (productIndex > -1) {
    // Update the existing cart item's quantity, size, color, and price
    cart.cartItems[productIndex] = {
      product: productId,
      quantity: cart.cartItems[productIndex].quantity + quantity,
      size,
      color: product.color,
      price,
    };
  } else {
    // If the product is not found in the cart, add it as a new item
    cart.cartItems.unshift({
      product: productId,
      quantity,
      size,
      color: product.color,
      price,
    });
  }

  // Calculate total cart price and save
  await calcTotalCartPrice(cart);

  // Response
  res.status(200).json({
    status: "Success",
    message: "Product added to cart successfully.",
    numOfCartItems: cart.cartItems.length,
    data: cart,
  });
});

// @desc    Get logged-in user's shopping cart
// @route   GET /api/v1/cart
// @access  Private
exports.getCart = asyncHandler(async (req, res) => {
  // Find the cart for the current user
  let cart = await cartModel.findOne({ user: req.user._id });

  if (cart) {
    // Update the cart to exclude any items with deleted products
    cart.cartItems = filterDeletedCartItems(cart.cartItems);

    // If the cart exists, calculate total price and save changes
    await calcTotalCartPrice(cart);
  } else {
    // If no cart exists, create a new one for the user
    cart = await cartModel.create({ user: req.user._id, cartItems: [] });
  }

  // Send the cart data in the response
  res.status(200).json({
    status: "Success", // Success status
    message: "Cart retrieved successfully.",
    numOfCartItems: cart.cartItems.length, // Number of items in the cart
    data: cart, // Cart details
  });
});

// @desc    Logged user removes product from his cart by id
// @route   DELETE /api/v1/cart/:productId
// @access  Private
exports.removeProductFromCart = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;

  // Find the cart for the current user
  let cart = await cartModel.findOne({ user: req.user._id });

  if (cart) {
    // Update the cart to exclude any items with deleted products
    cart.cartItems = filterDeletedCartItems(cart.cartItems);

    // Find the product in the cart by its ID
    const productIndex = cart.cartItems.findIndex(
      (item) => item.product._id.toString() === productId
    );

    // If the product exists in the cart, remove it
    if (productIndex > -1) {
      cart.cartItems.splice(productIndex, 1); // Remove the product from the cart
    }

    // Recalculate the total price after removing the product
    await calcTotalCartPrice(cart);
  } else {
    // If no cart exists for the user, create an empty cart
    cart = await cartModel.create({ user: req.user._id, cartItems: [] });
  }

  // Send the updated cart data in the response
  res.status(200).json({
    status: "Success", // Response status
    message: "Product removed from shopping cart successfully.",
    numOfCartItems: cart.cartItems.length, // Number of items left in the cart
    data: cart, // Updated cart details
  });
});

// @desc    Logged user clears their cart items
// @route   DELETE /api/v1/cart
// @access  Private
exports.clearCartItems = asyncHandler(async (req, res) => {
  // Find and update the user's cart, setting cartItems to an empty array
  let cart = await cartModel.findOneAndUpdate(
    { user: req.user._id },
    {
      cartItems: [], // Clear all items in the cart
    },
    { new: true } // Return the updated cart
  );

  if (cart) {
    // Recalculate the total price after clearing the cart
    await calcTotalCartPrice(cart);
  } else {
    // If no cart exists, create a new empty cart for the user
    cart = await cartModel.create({ user: req.user._id, cartItems: [] });
  }

  // Send the cleared cart data in the response
  res.status(200).json({
    status: "Success", // Response status
    message: "Shopping cart cleared successfully.",
    numOfCartItems: cart.cartItems.length, // Number of items in the cart (should be 0)
    data: cart, // Cleared cart data
  });
});

// @desc    Logged user apply coupon
// @route   PUT /api/v1/cart/applycoupon
// @access  Private
exports.applyCoupon = asyncHandler(async (req, res, next) => {
  const { couponName } = req.body; // Get the coupon name from the request body

  // Find the coupon by name and ensure it's not expired
  const coupon = await couponModel.findOne({
    name: couponName.toUpperCase(), // Convert the coupon name to uppercase for consistency
    expire: { $gt: Date.now() }, // Check if the coupon has not expired
  });

  // If no valid coupon is found, return an error
  if (!coupon) {
    return next(
      new ApiError(
        "the coupon you entered is either invalid or has expired. Please try a different coupon.",
        404
      )
    );
  }

  // Find the user's cart
  let cart = await cartModel.findOne({ user: req.user._id });

  if (cart) {
    // Update the cart to exclude any items with deleted products
    cart.cartItems = filterDeletedCartItems(cart.cartItems);

    // Recalculate total price before applying the coupon
    await calcTotalCartPrice(cart);

    if (cart.cartItems.length > 0) {
      const totalPrice = cart.totalPrice; // Get the total price of items in the cart
      const discountAmount = (totalPrice * coupon.discount) / 100; // Calculate the discount amount
      const totalPriceAfterDiscount = (totalPrice - discountAmount).toFixed(2); // Calculate price after discount

      // Apply the coupon and update cart fields
      cart.couponName = coupon.name;
      cart.couponDiscount = coupon.discount;
      cart.totalPriceAfterDiscount = totalPriceAfterDiscount;
      await cart.save(); // Save the cart with the coupon applied
    }
  } else {
    // If no cart exists for the user, create an empty cart
    cart = await cartModel.create({ user: req.user._id, cartItems: [] });
  }

  // Send a success response with the updated cart
  res.status(200).json({
    status: "Success", // Response status
    message: "Price discount applied successfully", // Success message
    numOfCartItems: cart.cartItems.length, // Number of items in the cart
    data: cart, // Updated cart data
  });
});
