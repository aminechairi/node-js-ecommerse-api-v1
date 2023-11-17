const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, "User id is required."]
    },
    cartItems: [
      {
        product: {
          type: mongoose.Schema.ObjectId,
          ref: 'Product',
          required: [true, "Product id is required."]
        },
        quantity: {
          type: Number,
          default: 1,
          min: 1,
        },
        size: {
          type: String,
          trim: true,
          uppercase: true,
          minlength: [1, "Too short product size."],
          maxlength: [8, "Too long product size."],
        },
        color: {
          type: String,
          trim: true,
          minlength: [3, "Too short color name."],
          maxlength: [32, "Too long color name."],
        },
        price: {
          type: Number,
          min: 0,
          required: [true, "Price is required."]
        },
      },
    ],
    taxPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    shippingPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPrice: {
      type: Number,
      min: 0,
    },
    couponName: {
      type: String,
      trim: true,
      minlength: [3, "Too short coupon name."],
      maxlength: [32, "Too long coupon name."],
    },
    couponDiscount: {
      type: Number,
      min: 0,
      max: 100,
    },
    totalPriceAfterDiscount: {
      type: Number,
      min: 0,
    },
  },
  { timestamps: true }
);

cartSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'cartItems.product',
    select: 'title price priceAfterDiscount imageCover images color quantity sizes sold',
  });
  next();
});

module.exports = mongoose.model('Cart', cartSchema);