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
    slung: {
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

const subCategoryMudel = mongoose.model(`subCategory`, subCategorySchema);

module.exports = subCategoryMudel;