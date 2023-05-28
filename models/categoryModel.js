const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category required"],
      // unique: ["Category must be unique", true],
      unique: true,
      minlength: [3, "Too short category name"],
      maxlength: [32, "Too long category name"],
    },
    // A and B => shoping.com/a-and-b
    slug: {
      type: String,
      lowercase: true,
    },
    image: String,
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

const CategoryMudel = mongoose.model(`Category`, categorySchema);

module.exports = CategoryMudel;