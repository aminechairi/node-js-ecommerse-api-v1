const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Coupon name is required.'],
      trim: true,
      unique: true,
      minlength: [3, "Too short coupon name."],
      maxlength: [32, "Too long coupon name."],
    },
    expire: {
      type: Date,
      required: [true, 'Coupon expire time is required.'],
    },
    discount: {
      type: Number,
      required: [true, 'Coupon discount value is required.'],
      min: 1,
      max: 100,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Coupon', couponSchema);