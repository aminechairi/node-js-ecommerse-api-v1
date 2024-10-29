const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiErrore");

const productModel = require("../models/productModel");
const couponModel = require("../models/couponModel");
const cartModel = require("../models/cartModel");
const { calcTotalCartPrice } = require("../utils/shoppingCartProcessing");

const validateProductAvailability = (product, quantity, size) => {
  if (product.sizes.length <= 0) {
    if (product.quantity <= 0) {
      return `Unfortunately, this product is currently out of stock.`;
    }
    if (product.quantity < quantity) {
      return `Only ${product.quantity} item(s) are available in stock.`;
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
      return `Only ${
        sizeItem.quantity
      } item(s) are available for size ${sizeItem.size.toUpperCase()}.`;
    }
    return null; // Valid product size state
  }
  return `We're sorry, but this product is not available for purchase.`; // Fallback case
};

// Find the smallest price in sizes
const findTheSmallestPriceInSize = (sizes) => {
  if (sizes.length === 0) return {};

  // Filtering sizes with a quantity greater than 0.
  const availableSizes = sizes.filter((item) => item.quantity > 0);

  let theSmallestPriceSize;
  if (availableSizes.length > 0) {
    theSmallestPriceSize = availableSizes.reduce((min, size) =>
      size.price < min.price ? size : min
    );
  } else {
    theSmallestPriceSize = sizes.reduce((min, size) =>
      size.price < min.price ? size : min
    );
  }

  return theSmallestPriceSize;
};

// @desc    Logged user add product to his cart.
// @route   POST /api/v1/cart
// @access  Private
exports.addProductToCart = asyncHandler(async (req, res, next) => {
  let { productId, quantity, size } = req.body;

  let product = await productModel
    .find({ _id: productId })
    .select(
      `title price priceBeforeDiscount discountPercent imageCover quantity color sizes sold ratingsAverage ratingsQuantity updatedAt`
    );

  product = product[0];

  // Validate product existence
  if (!product) {
    throw next(new ApiError(`No product for this ID: ${productId}.`, 404));
  }

  // Validate product availability
  const availabilityError = validateProductAvailability(
    product,
    quantity,
    size
  );
  if (availabilityError) {
    throw next(new ApiError(availabilityError, 400));
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

  // Update product quantity
  if (product.sizes.length <= 0) {
    // Decrease the overall product quantity
    product.quantity -= quantity;
    await productModel.updateOne(
      { _id: productId },
      {
        $set: {
          quantity: product.quantity, // Decrease quantity
        },
      },
      { timestamps: false }
    );
  } else if (product.sizes.length > 0) {
    // Update the quantity of the specified size
    product.sizes.forEach((item) => {
      if (item.size === size) {
        item.quantity -= quantity; // Decrease the quantity
      }
    });

    // Find the smallest price in sizes
    const theSmallestPriceSize = findTheSmallestPriceInSize(product.sizes);

    await productModel.updateOne(
      { _id: productId }, // Find the product by ID
      {
        $set: {
          sizes: [...product.sizes], // Update the sizes array
          price: theSmallestPriceSize.price ?? "", // Set the smallest price
          priceBeforeDiscount: theSmallestPriceSize.priceBeforeDiscount ?? "", // Set price before discount
          discountPercent: theSmallestPriceSize.discountPercent ?? "", // Set discount percent
          quantity: theSmallestPriceSize.quantity ?? "", // Set quantity
        },
      },
      { new: true, timestamps: false }
    );
  }

  // Find the index of the product in the cart if it already exists
  const productIndex = cart.cartItems.findIndex(
    (item) =>
      item.product._id.toString() === productId &&
      `${item.size}`.toLowerCase() === `${size}`.toLowerCase()
  );

  if (productIndex > -1) {
    // Update the existing cart item's quantity, size, color, and price
    cart.cartItems[productIndex] = {
      product: product,
      quantity: cart.cartItems[productIndex].quantity + quantity,
      size,
      color: product.color,
      price,
    };
  } else {
    // If the product is not found in the cart, add it as a new item
    cart.cartItems.unshift({
      product: product,
      quantity,
      size,
      color: product.color,
      price,
    });
  }

  // Calculate total cart price and save
  await calcTotalCartPrice(cart);

  // Send the cart data in the response
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
    // If the cart exists, calculate total price and save changes
    await calcTotalCartPrice(cart);
  } else {
    // If no cart exists, create a new one for the user
    cart = await cartModel.create({ user: req.user._id, cartItems: [] });
  }

  // Send the cart data in the response
  res.status(200).json({
    status: "Success",
    message: "Cart retrieved successfully.",
    numOfCartItems: cart.cartItems.length, // Number of items in the cart
    data: cart,
  });
});

// @desc    Updates the quantity of a product in the logged-in user's cart
// @route   PUT /api/v1/cart/:productId
// @access  Private
exports.updateProductQuantityInCart = asyncHandler(async (req, res, next) => {
  const { productId, quantity, size } = req.body;

  // Find the user's cart
  let cart = await cartModel.findOne({ user: req.user._id });

  if (cart) {
    // Locate the product in the cart by product ID and size
    const productIndex = cart.cartItems.findIndex(
      (item) => item.product._id.toString() === productId && item.size === size
    );

    // Check if product exists in cart
    if (productIndex > -1) {
      const cartItem = cart.cartItems[productIndex];

      // Check if the product has no sizes (single quantity)
      if (cartItem.product.sizes.length === 0) {
        const totalAvailableQuantity =
          cartItem.product.quantity + cartItem.quantity;

        // Check if requested quantity exceeds available stock
        if (totalAvailableQuantity < quantity) {
          return next(
            new ApiError(
              `Only ${totalAvailableQuantity} item(s) are available in stock.`,
              400
            )
          );
        }

        // Update product quantity in the database
        cartItem.product.quantity = totalAvailableQuantity - quantity;
        await productModel.updateOne(
          { _id: productId },
          { $set: { quantity: cartItem.product.quantity } },
          { timestamps: false }
        );

        // Update cart item quantity
        cart.cartItems[productIndex].quantity = quantity;
      } else {
        // If product has sizes, locate the specific size object
        const productSize = cartItem.product.sizes.find(
          (item) => item.size === cartItem.size
        );
        const totalAvailableQuantity = productSize.quantity + cartItem.quantity;

        // Validate available quantity for the selected size
        if (totalAvailableQuantity < quantity) {
          return next(
            new ApiError(
              `Only ${totalAvailableQuantity} item(s) are available for size ${cartItem.size.toUpperCase()}.`,
              400
            )
          );
        }

        // Update the specific size quantity
        productSize.quantity = totalAvailableQuantity - quantity;

        // Find and set the smallest price among available sizes
        const smallestPriceSize = findTheSmallestPriceInSize(
          cartItem.product.sizes
        );

        await productModel.updateOne(
          { _id: productId },
          {
            $set: {
              sizes: cartItem.product.sizes,
              price: smallestPriceSize.price ?? "",
              priceBeforeDiscount: smallestPriceSize.priceBeforeDiscount ?? "",
              discountPercent: smallestPriceSize.discountPercent ?? "",
              quantity: smallestPriceSize.quantity ?? "",
            },
          },
          { timestamps: false }
        );

        // Update cart item quantity
        cart.cartItems[productIndex].quantity = quantity;
      }
    }

    // Calculate and update the cart's total price
    await calcTotalCartPrice(cart);
  } else {
    // If no cart exists, create a new one for the user
    cart = await cartModel.create({ user: req.user._id, cartItems: [] });
  }

  // Send response with updated cart information
  res.status(200).json({
    status: "Success",
    message: "Product quantity updated successfully.",
    numOfCartItems: cart.cartItems.length,
    data: cart,
  });
});

// @desc    Logged user removes product from his cart by id
// @route   DELETE /api/v1/cart/:productId
// @access  Private
exports.removeProductFromCart = asyncHandler(async (req, res) => {});

// @desc    Logged user clears their cart items
// @route   DELETE /api/v1/cart
// @access  Private
exports.clearCartItems = asyncHandler(async (req, res) => {});

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
    throw next(
      new ApiError(
        "the coupon you entered is either invalid or has expired. Please try a different coupon.",
        404
      )
    );
  }

  // Find the user's cart
  let cart = await cartModel.findOne({ user: req.user._id });

  if (cart) {
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
