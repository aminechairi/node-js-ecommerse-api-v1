const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema(
  {
    cartItems: [
      {
        product: {
          type: mongoose.Schema.ObjectId,
          ref: 'Product',
        },
        quantity: {
          type: Number,
          default: 1,
          min: 1,
        },
        color: {
          type: String,
          trim: true,
          minlength: [3, "Too short color name"],
          maxlength: [32, "Too long color name"],
        },
        price: {
          type: Number,
          min: 0,
        },
      },
    ],
    totalCartPrice: {
      type: Number,
      min: 0,
    },
    totalPriceAfterDiscount: {
      type: Number,
      min: 0,
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Cart', cartSchema);