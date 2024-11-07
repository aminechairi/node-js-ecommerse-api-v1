const asyncHandler = require("express-async-handler");
const { Worker } = require('bullmq');

const ApiError = require("../utils/apiErrore");
const productModel = require("../models/productModel");
const couponModel = require("../models/couponModel");
const cartModel = require("../models/cartModel");
const { calcTotalCartPrice, handleProductsIfUpdatedOrDeleted } = require("../utils/shoppingCartProcessing");
const { findTheSmallestPriceInSize } = require("../utils/findTheSmallestPriceInSize");
const redisBullMQConnection = require('../config/redisBullMq');
const cartQueue = require("../redisBullMqQueues/cartQueue");

// Validate product availability
const validateProductAvailability = (product, quantity, size) => {
  if (product.sizes.length === 0) {
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

// @desc    Add a product to the user's cart
// @route   POST /api/v1/cart
// @access  Private
exports.addProductToCart = asyncHandler(async (req, res, next) => {
  // Extract productId, quantity, and size from the request body
  let { productId, quantity, size } = req.body;

  // Find the product in the database using productId
  const product = await productModel.findById(productId);

  // Check if the product exists, else return a 404 error
  if (!product) {
    return next(new ApiError(`No product found for ID: ${productId}.`, 404));
  }

  // Validate product availability
  const availabilityError = validateProductAvailability(product, quantity, size);
  if (availabilityError) {
    return next(new ApiError(availabilityError, 400));
  }

  // If no sizes are available, set size to undefined to avoid size-based handling
  if (product.sizes.length <= 0) size = undefined;

  // Determine the correct price based on the selected size (if sizes exist)
  const price =
    product.sizes.length > 0
      ? product.sizes.find(
          (item) => `${item.size}`.toLowerCase() === `${size}`.toLowerCase()
        ).price
      : product.price;

  // Find or create the user's cart in the database
  let cart =
    (await cartModel.findOne({ user: req.user._id })) ||
    (await cartModel.create({ user: req.user._id, cartItems: [] }));

  // Handle products if updated or deleted.
  handleProductsIfUpdatedOrDeleted(cart);

  // Handle cases where the product has no sizes
  if (product.sizes.length === 0) {
    // Deduct the requested quantity from the total quantity of the product
    await productModel.updateOne(
      { _id: productId },
      { $inc: { quantity: -quantity } },
      { timestamps: false }
    );
  }
  // Handle cases where the product has sizes
  else if (product.sizes.length > 0) {
    // Update the quantity for the specific size requested by the user
    const updatedSizes = product.sizes.map((item) => ({
      ...item.toObject(),
      // Decrease the quantity only for the selected size; retain the quantity for others
      quantity: item.size === size ? item.quantity - quantity : item.quantity,
    }));

    // Save the updated sizes back to the product document
    await productModel.updateOne(
      { _id: productId },
      { $set: { sizes: updatedSizes } },
      { new: true, timestamps: false }
    );
  }

  // Check if the product is already in the cart, based on ID and size
  const productIndex = cart.cartItems.findIndex(
    (item) =>
      item.product._id.toString() === productId &&
      `${item.size}`.toLowerCase() === `${size}`.toLowerCase()
  );

  // If product exists in the cart, update its quantity, else add as a new item
  if (productIndex > -1) {
    cart.cartItems[productIndex] = {
      product: product._id,
      quantity: cart.cartItems[productIndex].quantity + quantity, // Increment quantity
      size,
      color: product.color,
      price,
      idOfRedisBullMqJob: cart.cartItems[productIndex].idOfRedisBullMqJob,
    };
  } else {
    // Add redis bullmq job to remove item from cart if user doesn't buy it after 30m
    const job = await cartQueue.add(
      "clearCart",
      { userId: req.user._id, product: { productId, size } },
      {
        delay: 0.5 * 60 * 1000, // 30m
        removeOnComplete: true,
        // removeOnFail: true
      }
    );

    cart.cartItems.unshift({
      product: product._id,
      quantity,
      size,
      color: product.color,
      price,
      idOfRedisBullMqJob: job.id,
    });
  }

  // Calculate and update the total cart price
  await calcTotalCartPrice(cart);

  // Fetch the updated cart from the database
  cart = await cartModel.findOne({ user: req.user._id });

  // Respond with a success message, cart item count, and cart data
  res.status(200).json({
    status: "Success",
    message: "Product added to cart successfully.",
    numOfCartItems: cart.cartItems.length,
    data: cart,
  });
});

// Worker to remove item from cart if user doesn't buy it after 30m
const worker = new Worker(
  "cartQueue",
  async (job) => {
    const { userId, product } = job.data;
    const { productId, size } = product;

    // Find the user's cart in the database
    const cart = await cartModel.findOne({ user: userId });

    if (cart) {
      // Handle products if updated or deleted.
      handleProductsIfUpdatedOrDeleted(cart);

      // Find the index of the product in the cart using productId and size
      const productIndex = cart.cartItems.findIndex(
        (item) =>
          item.product._id.toString() === productId && item.size === size
      );

      // Check if the product exists in the cart
      if (productIndex > -1) {
        const cartItem = cart.cartItems[productIndex];

        // Handle cases where the product has no sizes
        if (cartItem.product.sizes.length === 0) {
          // Increase the product's quantity in the database to reflect the returned stock
          await productModel.updateOne(
            { _id: productId },
            { $inc: { quantity: cartItem.quantity } },
            { timestamps: false }
          );

          // Remove the product from the cart after updating the stock
          cart.cartItems.splice(productIndex, 1);
        }
        // Handle cases where the product has sizes
        else if (cartItem.product.sizes.length > 0) {
          // Create a new sizes array, updating the quantity for the specific size returned to stock
          const updatedSizes = cartItem.product.sizes.map((item) => ({
            ...item.toObject(),
            // Increase the quantity only for the size matching the cart item; keep others unchanged
            quantity:
              item.size === size
                ? item.quantity + cartItem.quantity
                : item.quantity,
          }));

          // Update the product document in the database with the modified sizes array
          await productModel.updateOne(
            { _id: productId },
            { $set: { sizes: updatedSizes } },
            { new: true, timestamps: false }
          );

          // Remove the product from the cart after updating the stock for the specific size
          cart.cartItems.splice(productIndex, 1);
        }
      }

      // Recalculate the total cart price after updates
      await calcTotalCartPrice(cart);
    }
  },
  { connection: redisBullMQConnection }
);

// Check jobs completed or failed
// worker
//   .on("completed", (job) => {    
//     console.log(`Job ${job.id} completed!`);
//   })
//   .on("failed", (job, err) => {
//     console.error(`Job ${job.id} failed with error: ${err.message}`);
//   });

// @desc    Retrieve the current user's cart
// @route   GET /api/v1/cart
// @access  Private
exports.getCart = asyncHandler(async (req, res) => {
  // Find the user's cart
  let cart = await cartModel.findOne({ user: req.user._id });

  if (cart) {
    // Handle products if updated or deleted.
    handleProductsIfUpdatedOrDeleted(cart);

    // Calculate total cart price if cart exists
    await calcTotalCartPrice(cart);
  } else {
    // If no cart exists, create an empty one for the user
    cart = await cartModel.create({ user: req.user._id, cartItems: [] });
  }

  // Send the response with cart data
  res.status(200).json({
    status: "Success",
    message: "Cart retrieved successfully.",
    numOfCartItems: cart.cartItems.length,
    data: cart,
  });
});

// @desc    Update the quantity of a specific product in the user's cart
// @route   PUT /api/v1/cart/:productId
// @access  Private
exports.updateProductQuantityInCart = asyncHandler(async (req, res, next) => {
  // Extract productId, quantity, and size from the request body
  const { productId, quantity, size } = req.body;

  // Find the user's cart in the database
  let cart = await cartModel.findOne({ user: req.user._id });

  if (cart) {
    // Handle products if updated or deleted.
    handleProductsIfUpdatedOrDeleted(cart);

    // Find the index of the product in the cart using productId and size
    const productIndex = cart.cartItems.findIndex(
      (item) => item.product._id.toString() === productId && item.size === size
    );

    // Check if the product exists in the cart
    if (productIndex > -1) {
      const cartItem = cart.cartItems[productIndex];

      // Handle cases where the product has no sizes
      if (cartItem.product.sizes.length === 0) {
        // Calculate the total quantity available, combining current stock with the quantity already in the cart
        const totalAvailableQuantity = cartItem.product.quantity + cartItem.quantity;

        // Check if the requested quantity exceeds the total available stock
        if (totalAvailableQuantity < quantity) {
          // Return an error if the requested quantity is greater than available stock
          return next(new ApiError(`Only ${totalAvailableQuantity} item(s) are available in stock.`, 400));
        }

        // Update the product's total quantity in the database to reflect the new stock after the update
        await productModel.updateOne(
          { _id: productId },
          { $set: { quantity: totalAvailableQuantity - quantity } },
          { timestamps: false }
        );

        // Update the quantity of the item in the cart to match the requested quantity
        cart.cartItems[productIndex].quantity = quantity;
      } 
      // Handle cases where the product has sizes
      else if (cartItem.product.sizes.length > 0) {
        // Find the specific size object that matches the user's selected size
        const productSize = cartItem.product.sizes.find(
          (item) => item.size === cartItem.size
        );

        // Calculate the total available quantity for the selected size, considering the cart's current quantity
        const totalAvailableQuantity = productSize.quantity + cartItem.quantity;

        // Check if the requested quantity exceeds the available stock for the selected size
        if (totalAvailableQuantity < quantity) {
          // Return an error if the requested quantity is greater than the stock for that size
          return next(new ApiError(`Only ${totalAvailableQuantity} item(s) are available for size ${cartItem.size.toUpperCase()}.`, 400));
        }

        // Create a new sizes array, updating only the quantity of the selected size
        const updatedSizes = cartItem.product.sizes.map((item) => ({
          ...item.toObject(),
          // Adjust the quantity for the matching size; leave others unchanged
          quantity:
            item.size === size
              ? totalAvailableQuantity - quantity
              : item.quantity,
        }));

        // Update the product document in the database with the modified sizes array
        await productModel.updateOne(
          { _id: productId },
          { $set: { sizes: updatedSizes } },
          { new: true, timestamps: false }
        );

        // Update the quantity of the item in the cart to match the requested quantity
        cart.cartItems[productIndex].quantity = quantity;
      }
    }

    // Recalculate the total cart price after updates
    await calcTotalCartPrice(cart);

    // Fetch the updated cart from the database
    cart = await cartModel.findOne({ user: req.user._id });
  } else {
    // If no cart exists, create a new cart for the user
    cart = await cartModel.create({ user: req.user._id, cartItems: [] });
  }

  // Respond with a success message, cart item count, and updated cart data
  res.status(200).json({
    status: "Success",
    message: "Product quantity updated successfully.",
    numOfCartItems: cart.cartItems.length,
    data: cart,
  });
});

// @desc    Remove a specific product from the user's cart
// @route   DELETE /api/v1/cart/:productId
// @access  Private
exports.removeProductFromCart = asyncHandler(async (req, res) => {
  // Extract productId, and size from the request body
  const { productId, size } = req.body;

  // Find the user's cart in the database
  let cart = await cartModel.findOne({ user: req.user._id });

  if (cart) {
    // Handle products if updated or deleted.
    handleProductsIfUpdatedOrDeleted(cart);

    // Find the index of the product in the cart using productId and size
    const productIndex = cart.cartItems.findIndex(
      (item) => item.product._id.toString() === productId && item.size === size
    );

    // Check if the product exists in the cart
    if (productIndex > -1) {
      const cartItem = cart.cartItems[productIndex];

      // Handle cases where the product has no sizes
      if (cartItem.product.sizes.length === 0) {
        // Increase the product's quantity in the database to reflect the returned stock
        await productModel.updateOne(
          { _id: productId },
          { $inc: { quantity: cartItem.quantity } },
          { timestamps: false }
        );

        // Remove redis bullmq job of item
        const job = await cartQueue.getJob(cartItem.idOfRedisBullMqJob);
        if (job) await job.remove();

        // Remove the product from the cart after updating the stock
        cart.cartItems.splice(productIndex, 1);
      }
      // Handle cases where the product has sizes
      else if (cartItem.product.sizes.length > 0) {
        // Create a new sizes array, updating the quantity for the specific size returned to stock
        const updatedSizes = cartItem.product.sizes.map((item) => ({
          ...item.toObject(),
          // Increase the quantity only for the size matching the cart item; keep others unchanged
          quantity:
            item.size === size
              ? item.quantity + cartItem.quantity
              : item.quantity,
        }));

        // Update the product document in the database with the modified sizes array
        await productModel.updateOne(
          { _id: productId },
          { $set: { sizes: updatedSizes } },
          { new: true, timestamps: false }
        );

        // Remove redis bullmq job of item
        const job = await cartQueue.getJob(cartItem.idOfRedisBullMqJob);
        if (job) await job.remove();

        // Remove the product from the cart after updating the stock for the specific size
        cart.cartItems.splice(productIndex, 1);
      }
    }

    // Recalculate the total cart price after updates
    await calcTotalCartPrice(cart);

    // Fetch the updated cart from the database
    cart = await cartModel.findOne({ user: req.user._id });
  } else {
    // If no cart exists, create a new cart for the user
    cart = await cartModel.create({ user: req.user._id, cartItems: [] });
  }

  // Respond with a success message, cart item count, and updated cart data
  res.status(200).json({
    status: "Success",
    message: "Product removed from cart successfully.",
    numOfCartItems: cart.cartItems.length,
    data: cart,
  });
});

// @desc    Clear all items from the user's cart
// @route   DELETE /api/v1/cart
// @access  Private
exports.clearCartItems = asyncHandler(async (req, res) => {
  // Find the user's cart in the database
  let cart = await cartModel.findOne({ user: req.user._id });

  if (cart) {
    // Handle products if updated or deleted.
    handleProductsIfUpdatedOrDeleted(cart);

    const storeUpdatedSizes = [];
    const jobIds = [];
    const bulkOps = cart.cartItems.map((cartItem) => {
      const { product, quantity, size, idOfRedisBullMqJob } = cartItem;

      // add IDs of items in jobIds
      jobIds.push(idOfRedisBullMqJob);

      // Handle cases where the product has no sizes
      if (product.sizes.length === 0) {
        // Return an update operation that increments the product's total quantity in the database
        return {
          updateOne: {
            filter: { _id: product._id },
            update: { $inc: { quantity: quantity } },
            timestamps: false,
          },
        };
      }
      // Handle cases where the product has sizes
      else if (product.sizes.length > 0) {
        // Check if the product already exists in the `storeUpdatedSizes` array
        const existingProductIndex = storeUpdatedSizes.findIndex(
          (stored) => stored.id === product._id.toString()
        );

        let updatedSizes;

        if (existingProductIndex !== -1) {
          // If the product is already in `storeUpdatedSizes`, update the sizes array by adjusting the quantity for the matching size
          updatedSizes = storeUpdatedSizes[existingProductIndex].sizes.map(
            (item) => ({
              ...item,
              quantity: item.size === size ? item.quantity + quantity : item.quantity,
            })
          );

          // Update the sizes in the `storeUpdatedSizes` array
          storeUpdatedSizes[existingProductIndex].sizes = updatedSizes;
        } else {
          // If the product is not in `storeUpdatedSizes`, create an updated sizes array from the original product sizes
          updatedSizes = product.sizes.map((item) => ({
            ...item.toObject(),
            quantity: item.size === size ? item.quantity + quantity : item.quantity,
          }));

          // Add the product with its updated sizes to `storeUpdatedSizes`
          storeUpdatedSizes.push({
            id: product._id.toString(),
            sizes: updatedSizes,
          });
        }

        // Find the size with the smallest price from the updated sizes
        const theSmallestPriceSize = findTheSmallestPriceInSize(updatedSizes);

        // Return an update operation to update the product's sizes and associated price fields in the database
        return {
          updateOne: {
            filter: { _id: product._id },
            update: {
              $set: { sizes: updatedSizes },
              price: theSmallestPriceSize.price ?? "",
              priceBeforeDiscount: theSmallestPriceSize.priceBeforeDiscount ?? "",
              discountPercent: theSmallestPriceSize.discountPercent ?? "",
              quantity: theSmallestPriceSize.quantity ?? "",
            },
            timestamps: false,
          },
        };
      }
    });

    // Execute bulkWrite operations to update products
    await productModel.bulkWrite(bulkOps);

    // Remove redis bullmq jobs of items
    await Promise.all(jobIds.map(async (jobId) => {
      const job = await cartQueue.getJob(jobId);
      if (job) await job.remove();
    }));

    // Clear all items from the cart
    cart.cartItems = [];

    // Recalculate the total cart price after updates
    await calcTotalCartPrice(cart);
  } else {
    // If no cart exists, create a new cart for the user
    cart = await cartModel.create({ user: req.user._id, cartItems: [] });
  }

  // Respond with a success message and updated cart data
  res.status(200).json({
    status: "Success",
    message: "All items cleared from cart successfully.",
    numOfCartItems: 0,
    data: cart,
  });
});

// @desc    Apply a discount coupon to the user's cart
// @route   PUT /api/v1/cart/applycoupon
// @access  Private
exports.applyCoupon = asyncHandler(async (req, res, next) => {
  const { couponName } = req.body;

  // Check if the coupon exists and is still valid
  const coupon = await couponModel.findOne({
    name: couponName.toUpperCase(),
    expire: { $gt: Date.now() },
  });

  if (!coupon) {
    return next(new ApiError("The coupon you entered is either invalid or has expired. Please try a different coupon.", 404));
  }

  // Retrieve the user's cart
  let cart = await cartModel.findOne({ user: req.user._id });

  if (cart) {
    // Handle products if updated or deleted.
    handleProductsIfUpdatedOrDeleted(cart);

    // Calculate the current total price of the cart
    await calcTotalCartPrice(cart);

    if (cart.cartItems.length > 0) {
      const totalPrice = cart.totalPrice;
      const discountAmount = (totalPrice * coupon.discount) / 100;
      const totalPriceAfterDiscount = (totalPrice - discountAmount).toFixed(2);

      // Update the cart with coupon details
      cart.couponName = coupon.name;
      cart.couponDiscount = coupon.discount;
      cart.totalPriceAfterDiscount = totalPriceAfterDiscount;
      await cart.save();
    }
  } else {
    // If no cart exists, create a new cart for the user
    cart = await cartModel.create({ user: req.user._id, cartItems: [] });
  }

  // Send the response with the updated cart information
  res.status(200).json({
    status: "Success",
    message: "Price discount applied successfully",
    numOfCartItems: cart.cartItems.length,
    data: cart,
  });
});
