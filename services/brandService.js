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

// upload single image
exports.uploadBrandImage = uploadSingleImage("image");

// image processing
exports.resizeImage = asyncHandler(async (req, res, next) => {
  const fileName = `brand-${uuidv4()}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(800, 800)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`uploads/brands/${fileName}`);
  // Save Image to Into Our db
  req.body.image = `${fileName}`;
  next();
});

// @desc Get List Of Brands
// @route GET /api/v1/brands
// @access Public
exports.getBrands = getAll(brandMudel);

// @desc Get Brand by id
// @route GET /api/v1/brands/:id
// @access Public
exports.getBrand = getOne(brandMudel);

// @desc Create Brand
// @route POST /api/v1/brand
// @access private
exports.crateBrand = createOne(brandMudel);

// @desc Update specific Brand
// @route PUT /api/v1/brands/:id
// @access private
exports.updateBrand = updateOne(brandMudel);

// @desc Delete specific brand
// @route DELETE /api/v1/brand/:id
// @access private
exports.deleteBrand = deleteOne(brandMudel);
