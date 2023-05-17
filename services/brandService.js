const slugify = require("slugify");
const asyncHandler = require("express-async-handler");
const ApiErrore = require("../utils/apiErrore");

const brandMudel = require("../models/brandModel");

// @desc Get List Of Brands
// @route GET /api/v1/brands
// @access Public
exports.getBrands = asyncHandler(async (req, res) => {
  const page = +req.query.page || 1;
  const limit = +req.query.limit || 4;
  const skip = (page - 1) * limit;
  const brands = await brandMudel.find({}).skip(skip).limit(limit);
  res.status(200).json({ 
    result: brands.length,
    page: page,
    data: brands,
  });
});

// @desc Get Brand by id
// @route GET /api/v1/brands/:id
// @access Public
exports.getBrand = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const brand = await brandMudel.findById(id);
  if (!brand) {
    return next(new ApiErrore(`No brand for this id ${id}`, 404));
  };
  res.status(200).json({
    data: brand,
  });
});

// @desc Create Brand
// @route POST /api/v1/brand
// @access private
exports.crateBrand = asyncHandler(async (req, res) => {
  const name = req.body.name;
  const brand = await brandMudel.create({
    name: name,
    slug: slugify(name),
  });
  res.status(201).json({
    data: brand,
  });
});

// @desc Update specific Brand
// @route PUT /api/v1/brands/:id
// @access private
exports.updateBrand = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const name = req.body.name;
  const brand = await brandMudel.findByIdAndUpdate(
    { _id: id },
    {
      name: name,
      slug: slugify(name),
    },
    { new: true }
  );
  if (!brand) {
    return next(new ApiErrore(`No brand for this id ${id}`, 404));
  };
  res.status(200).json({
    data: brand,
  });
});

// @desc Delete specific brand
// @route DELETE /api/v1/brand/:id
// @access private
exports.deleteBrand = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const brand = await brandMudel.findByIdAndDelete(
    { _id: id }
  );
  if (!brand) {
      return next(new ApiErrore(`No brand for this id ${id}`, 404));
    };
  res.status(200).json({
      data: brand,
    });
});