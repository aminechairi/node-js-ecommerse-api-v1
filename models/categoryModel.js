const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required."],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, "Too short category name."],
      maxlength: [32, "Too long category name."],
    },
    slug: {
      type: String,
      required: [true, "Category slug is required."],
      trim: true,
      lowercase: true,
    },
    image: {
      type: String,
      required: [true, "Category image is required."],
      trim: true,
    },
  },
  { timestamps: true }
);

const setImageUrl = (doc) => {
  if (doc.image) {
    const imageUrl = `${process.env.BASE_URL}/categories/${doc.image}`;
    doc.image = imageUrl;
  }
};

// findOne, findAll, update, delete
categorySchema.post("init", function (doc) {
  setImageUrl(doc);
});

// create
categorySchema.post("save", function (doc) {
  setImageUrl(doc);
});

module.exports = mongoose.model(`Category`, categorySchema);