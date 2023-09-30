const mongoose = require("mongoose");

const subCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Sub ategory name is required."],
      trim: true,
      minlength: [3, "Too short sub category name."],
      maxlength: [32, "Too long sub category name."],
    },
    slug: {
      type: String,
      required: [true, "Sub category slug is required."],
      trim: true,
      lowercase: true,
    },
    category: {
      type: mongoose.Schema.ObjectId,
      ref: `Category`,
      required: [true, "Sub category must be belong to category."],
    },
    image: {
      type: String,
      required: [true, "sub category image is required."],
      trim: true,
    },
  },
  { timestamps: true }
);

// mongoose query middleware
// subCategorySchema.pre("find", function(next) {
//   this.populate({
//     path: "category",
//     select: "name -_id",
//   });
//   next();
// });

const setImageUrl = (doc) => {
  if (doc.image) {
    const imageUrl = `${process.env.BASE_URL}/subCategories/${doc.image}`;
    doc.image = imageUrl;
  }
};

// findOne, findAll, update, delete
subCategorySchema.post("init", function (doc) {
  setImageUrl(doc);
});

// create
subCategorySchema.post("save", function (doc) {
  setImageUrl(doc);
});

module.exports = mongoose.model(`subCategory`, subCategorySchema);