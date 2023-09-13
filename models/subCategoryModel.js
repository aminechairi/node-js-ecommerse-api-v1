const mongoose = require("mongoose");

const subCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: String,
      required: [true, "subCategory is required"],
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
      required: [true, `subCategory must be belong to parent category`],
    },
    image: String,
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

const subCategoryModel = mongoose.model(`subCategory`, subCategorySchema);

module.exports = subCategoryModel;