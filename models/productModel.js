const mongoose = require('mongoose');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const s3Client = require('../config/s3Client');

const awsBuckName = process.env.AWS_BUCKET_NAME;
const expiresIn = process.env.EXPIRE_IN;

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Product title is required."],
      trim: true,
      minlength: [3, "Product title must be at least 3 characters."],
      maxlength: [200, "Product title cannot exceed 200 characters."],
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
      minlength: [32, "Product description must be at least 32 characters."],
      maxlength: [1000, "Product description cannot exceed 1000 characters."],
    },
    price: {
      type: Number,
      min: [0, "Product price must be between 0 and 10000."],
      max: [1000, "Product price must be between 0 and 10000."],
    },
    priceAfterDiscount: {
      type: Number,
      min: [0, "Product price after discount must be between 0 and 10000."],
      max: [10000, "Product price after discount must be between 0 and 10000."],
    },
    color: {
      type: String,
      trim: true,
      minlength: [3, "Product color name must be at least 3 characters."],
      maxlength: [32, "Product color name cannot exceed 32 characters."],
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
    quantity: {
      type: Number,
      min: [1, "Product quantity must be between 1 and 1000."],
      max: [1000, "Product quantity must be between 1 and 1000."],
    },
    sizes: [
      {
        size: {
          type: String,
          trim: true,
          uppercase: true,
          minlength: [1, "Too short product size."],
          maxlength: [8, "Too long product size."],
        },
        quantity: {
          type: Number,
          min: [1, "Prodact quantity number cannot be less than 1."],
        },
        price: {
          type: Number,
          min: [0, "Prodact price number cannot be less than 0."],
        },
        priceAfterDiscount: {
          type: Number,
          min: [0, "Prodact price after discount number cannot be less than 0."],
        },
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
    group: {
      type: mongoose.Schema.ObjectId,
      ref: "productsGroup",
    },
    sold: {
      type: Number,
      min: [0, "Product sold must be between 0 and 1000."],
      max: [1000, "Product sold must be between 0 and 1000."],
      default: 0,
    },
    ratingsAverage: {
      type: Number,
      min: [1, "Product ratings average must be between 1 and 5."],
      max: [5, "Product ratings average must be between 1 and 5."],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
      min: [0, "Product ratings quantity must be 0 or greater."],
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

productSchema.virtual(
  "saves",
  {
    ref: "Save",
    foreignField: "productId",
    localField: "_id",
  }
);

// mongoose query middleware
productSchema.pre("findOne", function(next) {
  this.populate({
    path: "category subCategories underSubCategories brand",
    select: "name image"
  })
  .populate({
    path: "group",
    select: "groupName productsIDs -_id"
  })
  .populate({
    path: "reviews",
    select: "title ratings -product"
  })
  next();
});

const setImageUrl = async (doc) => {

  if (doc.imageCover) {
  
    const getObjectParams = {
      Bucket: awsBuckName,
      Key: `products/${doc.imageCover}`,
    };
  
    const command = new GetObjectCommand(getObjectParams);
    const imageUrl = await getSignedUrl(s3Client, command, { expiresIn });
  
    doc.imageCover = imageUrl;

  };

  if (doc.images) {

    let imageList = [];

    await Promise.all(

      doc.images.map(async (image) => {
    
        const getObjectParams = {
          Bucket: awsBuckName,
          Key: `products/${image}`,
        };
      
        const command = new GetObjectCommand(getObjectParams);
        const imageUrl = await getSignedUrl(s3Client, command, { expiresIn });
  
        imageList.push(imageUrl);
  
      })

    );

    doc.images = imageList;

  };

};

// findOne, findAll, update, delete
productSchema.post("init", async function (doc) {
  await setImageUrl(doc);
});

// create
productSchema.post("save", async function (doc) {
  await setImageUrl(doc);
});

module.exports = mongoose.model("Product", productSchema);