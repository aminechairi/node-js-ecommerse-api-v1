const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../config/s3Client');
const sharp = require("sharp");
const asyncHandler = require("express-async-handler");
const { v4: uuidv4 } = require("uuid");

const ApiError = require("../utils/apiErrore");
const {
  createOne,
  getOne,
  getAll,
} = require("./handlersFactory");
const {
  uploadMultipleImages,
} = require("../middlewares/uploadImageMiddleware");
const productModel = require("../models/productModel");
const reviewModel = require("../models/reviewModel");
const saveModel = require("../models/saveModel");

const awsBuckName = process.env.AWS_BUCKET_NAME;

// Upload multiple images
exports.uploadProductImages = uploadMultipleImages([
  {
    name: "imageCover",
    maxCount: 1,
  },
  {
    name: "images",
    maxCount: 6,
  },
]);

// Images processing
exports.resizeProductImages = asyncHandler(async (req, res, next) => {

  // 1 - Image processing for imageCover
  if (req.files.imageCover) {

    const imageFormat = 'jpeg';

    const buffer = await sharp(req.files.imageCover[0].buffer)
    .resize(960, 1312)
    .toFormat(imageFormat)
    .jpeg({ quality: 100 })
    .toBuffer();

    const imageCoverName = `product-${uuidv4()}-${Date.now()}.${imageFormat}`;

    const params = {
      Bucket: awsBuckName,
      Key: `products/${imageCoverName}`,
      Body: buffer,
      ContentType: `image/${imageFormat}`,
    };

    const command = new PutObjectCommand(params);
    await s3Client.send(command);

    // Save image name to Into Your db
    req.body.imageCover = imageCoverName;

  };

  // 2 - Image processing for images
  if (req.files.images) {

    req.body.images = [];

    await Promise.all(

      req.files.images.map(async (img, index) => {

        const imageFormat = 'jpeg';

        const buffer = await sharp(img.buffer)
        .resize(960, 1312)
        .toFormat(imageFormat)
        .jpeg({ quality: 100 })
        .toBuffer();

        const imageName = `product-${uuidv4()}-${Date.now()}-${index + 1}.${imageFormat}`;
    
        const params = {
          Bucket: awsBuckName,
          Key: `products/${imageName}`,
          Body: buffer,
          ContentType: `image/${imageFormat}`,
        };
    
        const command = new PutObjectCommand(params);
        await s3Client.send(command);
    
        // Save image name to Into Your db
        req.body.images.push(`${imageName}`);

      })

    );

  };

  next();
});

// @desc    Get list of products
// @route   GET /api/v1/products
// @access  Public
exports.getProducts = getAll(productModel, `Product`);

// @desc    Get product by id
// @route   GET /api/v1/products/:id
// @access  Public
exports.getProduct = getOne(productModel, {
  path: "reviews",
  select: "title ratings -product"
});

// @desc    Create product
// @route   POST /api/v1/products
// @access  Private
exports.createProduct = createOne(productModel);

// @desc    Update product by id
// @route   PUT /api/v1/products/:id
// @access  Private
exports.updateProduct = asyncHandler(async (req, res, next) => {

  const { id } = req.params;
  const body = req.body;

  if (body.imageCover || body.images) {

    let product = await productModel.findByIdAndUpdate(
      id,
      body,
    );

    if (!product) {
      return next(new ApiError(`No product for this id ${id}`, 404));
    };

    let allUrlsImages = [];
    if (body.imageCover) {
      allUrlsImages.push(product.imageCover);
    };
    if (body.images) {
      allUrlsImages.push(...product.images);
    };
  
    const keys = allUrlsImages.map((item) => {
      const imageUrl = `${item}`;
      const baseUrl = `${process.env.AWS_BASE_URL}/`;
      const restOfUrl = imageUrl.replace(baseUrl, '');
      const key = restOfUrl.slice(0, restOfUrl.indexOf('?'));
      return key;
    });

    await Promise.all(
  
      keys.map(async (key) => {
  
        const params = {
          Bucket: awsBuckName,
          Key: key,
        };
  
        const command = new DeleteObjectCommand(params);
        await s3Client.send(command);
  
      })
  
    );

    product = await productModel.find({ _id: id });

    res.status(200).json({ data: product[0] });

  } else {

    const product = await productModel.findByIdAndUpdate(
      id,
      body,
      { new: true }
    );

    if (!product) {
      return next(new ApiError(`No product for this id ${id}`, 404));
    };
  
    res.status(200).json({ data: product });

  };

});

// @desc    Delete Product by id
// @route   DELETE /api/v1/products/:id
// @access  Private
exports.deleteProduct =   asyncHandler(async (req, res, next) => {

  const { id } = req.params;

  const product = await productModel.findByIdAndDelete({ _id: id });
  if (!product) {
    return next(new ApiError(`No product for this id ${id}`, 404));
  };

  let allUrlsImages = [];
  if (product.images) {
    allUrlsImages.push(...product.images);
  };
  if (product.imageCover) {
    allUrlsImages.push(product.imageCover);
  };

  const keys = allUrlsImages.map((item) => {
    const imageUrl = `${item}`;
    const baseUrl = `${process.env.AWS_BASE_URL}/`;
    const restOfUrl = imageUrl.replace(baseUrl, '');
    const key = restOfUrl.slice(0, restOfUrl.indexOf('?'));
    return key;
  });

  await Promise.all(

    keys.map(async (key) => {

      const params = {
        Bucket: awsBuckName,
        Key: key,
      };

      const command = new DeleteObjectCommand(params);
      await s3Client.send(command);

    })

  );

  await reviewModel.deleteMany({ product: id });
  await saveModel.deleteMany({ productId: id });

  res.status(200).json({ data: product });

});