const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    uniqueName: {
      type: String,
      required: [true, "Product unique name is required."],
      trim: true,
      uppercase: true,
      minlength: [3, "Too short product unique name."],
      maxlength: [32, "Too long product unique name."],
    },
    title: {
      type: String,
      required: [true, "Product title is required."],
      trim: true,
      minlength: [3, "Too short product title."],
      maxlength: [200, "Too long product title."],
    },
    slug: {
      type: String,
      required: [true, "Product slug is required."],
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required."],
      trim: true,
      minlength: [20, "Too short product description."],    
    },
    quantity: {
      type: Number,
      required: [true, "Product quantity is required."],
      min: [1, "Prodact quantity number cannot be less than 1."],
    },
    sold: {
      type: Number,
      min: [0, "Prodact sold number cannot be less than 0."],
      default: 0,
    },
    price: {
      type: Number,
      required: [true, "Product price is required."],
      min: [0, "Prodact price number cannot be less than 0."],
    },
    priceAfterDiscount: {
      type: Number,
      min: [0, "Prodact price after discount number cannot be less than 0."],
    },
    color: {
      type: String,
      trim: true,
      minlength: [3, "Too short product color name."],
      maxlength: [32, "Too long product color name."],
    },
    imageCover: {
      type: String,
      required: [true, "Product image cover is required."],
      trim: true,
    },
    images: [
      {
        type: String,
        trim: true,
      },
    ],
    category: {
      type: mongoose.Schema.ObjectId,
      ref: "Category",
      required: [true, "Product must belong to category."],
    }, 
    subCategories: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "subCategory",
      },
    ],
    underSubCategories: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "underSubCategory",
      },
    ],
    brand: {
      type: mongoose.Schema.ObjectId,
      ref: "Brand",
    },
    ratingsAverage: {
      type: Number,
      min: [1, "Rating must be abave or equal 1.0"],
      max: [5, "Rating must be below or equal 5.0"],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// mongoose virtual populate
productSchema.virtual(
  "reviews",
  {
    ref: "Review",
    foreignField: "product",
    localField: "_id",
  }
);

// mongoose query middleware
productSchema.pre("findOne", function(next) {
  this.populate({
    path: "category subCategories underSubCategories brand",
    select: "name image"
  })
  next();
});

const setImageUrl = (doc) => {
  if (doc.imageCover) {
    const imageUrl = `${process.env.BASE_URL}/products/${doc.imageCover}`;
    doc.imageCover = imageUrl;
  }
  if (doc.images) {
    let imageList = [];
    doc.images.forEach(img => {
      const imgUrl = `${process.env.BASE_URL}/products/${img}`;
      imageList.push(imgUrl);
    });
    doc.images = imageList;
  }
};

// findOne, findAll, update, delete
productSchema.post("init", function (doc) {
  setImageUrl(doc);
});

// create
productSchema.post("save", function (doc) {
  setImageUrl(doc);
});

module.exports = mongoose.model("Product", productSchema);