const mongoose = require("mongoose");

const brandSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Brand required"],
      unique: true,
      minlength: [2, "Too short brans name"],
      maxlength: [32, "Too long brand name"],
    },
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