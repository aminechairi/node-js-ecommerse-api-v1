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
const productModel = require("../models/productModel");

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
    const imageCoverFileName = `products-${uuidv4()}-${Date.now()}-cover.jpeg`;
    await sharp(req.files.imageCover[0].buffer)
      .resize(800, 800)
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toFile(`uploads/products/${imageCoverFileName}`);
    // Save ImageCover to Into Our db
    req.body.imageCover = `${imageCoverFileName}`;
  };
  // 2 - Image processing for images
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

exports.editeReqBody = (req, res, next) => {
  console.log(req.body);
  req.body.uniqueName = `${req.body.uniqueName}`.toUpperCase().replaceAll(" ", "");
  next();
};

// @desc Get list of products
// @route GET /api/v1/products
// @access Public
exports.getProducts = getAll(productModel, `Product`);

// @desc Get product by id
// @route GET /api/v1/products/:id
// @access Public
exports.getProduct = getOne(productModel, "reviews");

// @desc Create product
// @route POST /api/v1/products
// @access Private
exports.createProduct = createOne(productModel);

// @desc Update product by id
// @route PUT /api/v1/products/:id
// @access Private
exports.updateProduct = updateOne(productModel);

// @desc Delete Product by id
// @route DELETE /api/v1/products/:id
// @access Private
exports.deleteProduct = deleteOne(productModel);