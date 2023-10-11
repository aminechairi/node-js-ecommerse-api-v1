const mongoose = require("mongoose");

const saveSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: `User`,
      required: [true, "User id is required."],
    },
    productId: {
      type: mongoose.Schema.ObjectId,
      ref: `Product`,
      required: [true, "Product id is required."],
    }
  },
  { timestamps: true },
);

saveSchema.pre("find", function (next) {
  this.populate({
    path: 'productId',
    select: 'title quantity sold price priceAfterDiscount imageCover images',
  });
  next();
});

module.exports = mongoose.model("Save", saveSchema);