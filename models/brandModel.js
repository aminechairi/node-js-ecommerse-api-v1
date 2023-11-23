const mongoose = require("mongoose");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const s3Client = require('../config/s3Client');

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Brand name is required."],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [2, "Too short brand name."],
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

const setImageUrl = async (doc) => {

  if (doc.image) {

    const awsBuckName = process.env.AWS_BUCKET_NAME;
    const expiresIn = process.env.EXPIRE_IN;
  
    const getObjectParams = {
      Bucket: awsBuckName,
      Key: `brands/${doc.image}`,
    };
  
    const command = new GetObjectCommand(getObjectParams);
    const imageUrl = await getSignedUrl(s3Client, command, { expiresIn });
  
    doc.image = imageUrl;

  };

};

// findOne, findAll, update, delete
brandSchema.post("init", async function (doc) {
  await setImageUrl(doc);
});

// create
brandSchema.post("save", async function (doc) {
  await setImageUrl(doc);
});

module.exports = mongoose.model("Brand", brandSchema);