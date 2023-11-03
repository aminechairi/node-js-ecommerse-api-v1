const mongoose = require("mongoose");

const underSubCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Under sub category name is required."],
      trim: true,
      lowercase: true,
      minlength: [3, "Too short under sub category name."],
      maxlength: [32, "Too long under sub category name."],
    },
    slug: {
      type: String,
      required: [true, "Under sub category slug is required."],
      trim: true,
      lowercase: true,
    },
    subCategory: {
      type: mongoose.Schema.ObjectId,
      ref: `subCategory`,
      required: [true, "Under Sub category must be belong to sub category."],
      immutable: true,
    },
    image: {
      type: String,
      required: [true, "Under sub category image is required."],
      trim: true,
    },
  },
  { timestamps: true }
);

// mongoose query middleware
underSubCategorySchema.pre("findOne", function(next) {
  this.populate({
    path: "subCategory",
    select: "name image",
  });
  next();
});

const setImageUrl = (doc) => {
  if (doc.image) {
    const imageUrl = `${process.env.BASE_URL}/underSubCategories/${doc.image}`;
    doc.image = imageUrl;
  };
};

// findOne, findAll, update, delete
underSubCategorySchema.post("init", function (doc) {
  setImageUrl(doc);
});

// create
underSubCategorySchema.post("save", function (doc) {
  setImageUrl(doc);
});

module.exports = mongoose.model(`underSubCategory`, underSubCategorySchema);