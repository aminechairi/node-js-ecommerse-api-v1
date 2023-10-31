const mongoose = require("mongoose");

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Brand name is required."],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, "Too short brand name."],
      maxlength: [32, "Too long brand name."],
    },
    slug: {
      type: String,
      required: [true, "Brand slug is required."],
      trim: true,
      lowercase: true,
    },
    image: {
      type: String,
      required: [true, "Brand image is required."],
      trim: true,
    },
  },
  { timestamps: true }
);

const setImageUrl = (doc) => {
  if (doc.image) {
    const imageUrl = `${process.env.BASE_URL}/brands/${doc.image}`;
    doc.image = imageUrl;
  }
};

// findOne, findAll, update, delete
brandSchema.post("init", function (doc) {
  setImageUrl(doc);
});

// create a new category
brandSchema.post("save", function (doc) {
  setImageUrl(doc);
});

module.exports = mongoose.model("Brand", brandSchema);