const mongoose = require("mongoose");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const s3Client = require('../config/s3Client');

const subCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Sub ategory name is required."],
      trim: true,
      lowercase: true,
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
      immutable: true,
    },
    image: {
      type: String,
      required: [true, "Sub category image is required."],
      trim: true,
    },
  },
  { timestamps: true }
);

// mongoose query middleware
subCategorySchema.pre("findOne", function(next) {
  this.populate({
    path: "category",
    select: "name image",
  });
  next();
});

const setImageUrl = async (doc) => {

  if (doc.image) {

    const awsBuckName = process.env.AWS_BUCKET_NAME;
    const expiresIn = process.env.EXPIRE_IN;

    const getObjectParams = {
      Bucket: awsBuckName,
      Key: `subCategories/${doc.image}`,
    };

    const command = new GetObjectCommand(getObjectParams);
    const imageUrl = await getSignedUrl(s3Client, command, { expiresIn });

    doc.image = imageUrl;

  };

};

// findOne, findAll, update, delete
subCategorySchema.post("init", async function (doc) {
  await setImageUrl(doc);
});

// create
subCategorySchema.post("save", async function (doc) {
  await setImageUrl(doc);
});

module.exports = mongoose.model(`subCategory`, subCategorySchema);