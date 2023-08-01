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
const { uploadSingleImage } = require("../middlewares/uploadImageMiddleware");

const brandMudel = require("../models/brandModel");

// Upload single image
exports.uploadBrandImage = uploadSingleImage("image");

// Image processing
exports.resizeImage = asyncHandler(async (req, res, next) => {
  const fileName = `brand-${uuidv4()}-${Date.now()}.jpeg`;
  if (req.file) {
    await sharp(req.file.buffer)
      .resize(800, 800)
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toFile(`uploads/brands/${fileName}`);
    // Save image to Into Our db
    req.body.image = `${fileName}`;
  }
  next();
});

// @desc Get List of brands
// @route GET /api/v1/brands
// @access Public 
exports.getBrands = getAll(brandMudel);

// @desc Get brand by id
// @route GET /api/v1/brands/:id
// @access Public
exports.getBrand = getOne(brandMudel);

// @desc Create brand
// @route POST /api/v1/brand
// @access Private admine & manager
exports.createBrand = createOne(brandMudel);

// @desc Update specific Brand
// @route PUT /api/v1/brands/:id
// @access Private admine & manager
exports.updateBrand = updateOne(brandMudel);

// @desc Delete specific brand
// @route DELETE /api/v1/brand/:id
// @access Private admine
exports.deleteBrand = deleteOne(brandMudel);