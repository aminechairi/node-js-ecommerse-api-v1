const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    couponCode: {
      type: String,
      required: [true, "Coupon code is required."],
      unique: true,
      trim: true,
      minlength: [3, "Coupon code must be at least 3 characters."],
      maxlength: [32, "Coupon code cannot exceed 32 characters."],
    },
    expire: {
      type: Date,
      required: [true, "Expiration date is required."],
      validate: {
        validator: function (value) {
          return value > Date.now();
        },
        message: "Expiration date must be in the future."
      },
    },
    discount: {
      type: Number,
      required: [true, "Discount value is required."],
      min: [1, "Discount value must be at least 1%."],
      max: [100, "Discount value cannot exceed 100%."],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Coupon", couponSchema);
