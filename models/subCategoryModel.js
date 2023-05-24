const mongoose = require("mongoose");

const subCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: String,
      required: [true, "Category required"],
      // unique: [true, `subCategory must be uniqye`],
      unique: true,
      minlength: [2, `To short subCategor name`],
      maxlength: [32, `To long subCategor name`],
    },
    slug: {
      type: String,
      lowercase: true,
    },
    category: {
      type: mongoose.Schema.ObjectId,
      ref: `Category`,
      required: [true, `subCategory must be belong tp parent category`],
    },
  },
  { timestamps: true }
);

// mongoose query middleware
subCategorySchema.pre("find", function(next) {
  this.populate({
    path: "category",
    select: "name -_id",
  });
  next();
});

const subCategoryMudel = mongoose.model(`subCategory`, subCategorySchema);

module.exports = subCategoryMudel;