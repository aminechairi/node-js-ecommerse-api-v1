const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, "User is required."],
    },
    cartItems: [
      {
        product: {
          type: mongoose.Schema.ObjectId,
          ref: 'Product',
          required: [true, "Product id si required."]
        },
        quantity: {
          type: Number,
          min: 1,
          required: [true, "Quantity si required."]
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
          required: [true, "Price si required."]
        },
      },
    ],
    shippingAddress: {
      alias: {
        type: String,
        required: [true, "Alias is required."],
        trim: true,
        minlength: [2, "Too short alias."],
        maxlength: [32, "Too long alias."],
      },
      details: {
        type: String,
        required: [true, "Details is required."],
        trim: true,
        minlength: [8, "Too short details."],
        maxlength: [64, "Too long details."]
      },
      phone: {
        type: String,
        required: [true, "Phone number is required."],
      },
      city: {
        type: String,
        required: [true, "City is required."],
        trim: true,
        minlength: [2, "Too short city."],
        maxlength: [32, "Too long city."],
      },
      postalCode: {
        type: String,
        required: [true, "Postal code is required."],
        trim: true,
      },
    },
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
    paymentMethodType: {
      type: String,
      enum: ["card", "cash"],
      default: "cash",
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: Date,
    isDelivered: {
      type: Boolean,
      default: false,
    },
    deliveredAt: Date,
  },
  { timestamps: true }
);

orderSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'cartItems.product',
    select: 'title price priceAfterDiscount imageCover images',
  }).populate({
    path: "user",
    select: "firstName lastName email phone profileImage",
  })
  next();
});

module.exports = mongoose.model("Oredr", orderSchema);