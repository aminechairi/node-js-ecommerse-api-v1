const sharp = require("sharp");
const asyncHandler = require("express-async-handler");
const { v4: uuidv4 } = require("uuid");

const {
  deleteOne,
  updateOne,
  createOne,
  getOne,
  getAll,
} = require("./handlersFactory");
const {
  uploadMultipleImages,
} = require("../middlewares/uploadImageMiddleware");

const productMudel = require("../models/productModel");

// upload multiple images
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

// images processing
exports.resizeProductImages = asyncHandler(async (req, res, next) => {
  // 1 - image processing for imageCover
  if (req.files.imageCover) {
    const imageCoverFileName = `products-${uuidv4()}-${Date.now()}-cover.jpeg`;
    await sharp(req.files.imageCover[0].buffer)
      .resize(800, 800)
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toFile(`uploads/products/${imageCoverFileName}`);
    // Save ImageCover to Into Our db
    req.body.imageCover = `${imageCoverFileName}`;
  };
  // 2 - image processing for images
  if (req.files.images) {
    req.body.images = [];
    await Promise.all(
      req.files.images.map(async (img, index) => {
        const imageName = `product-${uuidv4()}-${Date.now()}-${index + 1}.jpeg`;
        await sharp(img.buffer)
          .resize(800, 800)
          .toFormat("jpeg")
          .jpeg({ quality: 90 })
          .toFile(`uploads/products/${imageName}`);
        // Save Images to Into Our db
        req.body.images.push(`${imageName}`);
      })
    );
  };
  next();
});

// @desc Get List Of Products
// @route GET /api/v1/products
// @access Public
exports.getProducts = getAll(productMudel, `Product`);

// @desc Get Product by id
// @route GET /api/v1/products/:id
// @access Public
exports.getProduct = getOne(productMudel);

// @desc Create Product
// @route POST /api/v1/products
// @access private
exports.createProduct = createOne(productMudel);

// @desc Update specific Product
// @route PUT /api/v1/products/:id
// @access private
exports.updateProduct = updateOne(productMudel);

// @desc Delete specific Product
// @route DELETE /api/v1/products/:id
// @access private
exports.deleteProduct = deleteOne(productMudel);
