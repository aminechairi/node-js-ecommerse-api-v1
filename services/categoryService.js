const slugify = require('slugify');
const asyncHandler = require('express-async-handler');
const ApiErrore = require("../utils/apiErrore");

const CategoryMudel = require(`../models/categoryModel`);

// @desc Get List Of Categories
// @route GET /api/v1/categories
// @access Public
exports.getCategories = asyncHandler(async (req, res) => {
  const page = +req.query.page || 1;
  const limit = +req.query.limit || 4;
  const skip = (page - 1) * limit;
  const categories = await CategoryMudel.find({}).skip( skip ).limit( limit );
  res.status(200).json( { result: categories.length, page: page, data: categories } );
});

// @desc Get Category by id
// @route GET /api/v1/categories/:id
// @access Public
exports.getCategory = asyncHandler(async (req, res, next)  => {
  const { id } = req.params;
  const category = await CategoryMudel.findById(id);
  if (!category) {
    return next(new ApiErrore(`No category for this id ${id}`, 404));
  } 
  res.status(200).json({ data: category });
});

// @desc Create Category
// @route POST /api/v1/categories
// @access private
exports.createCategories = asyncHandler(async (req, res) => {
  const name = req.body.name;
  // async await
  const category = await CategoryMudel.create({ name: name, slung: slugify(name) });
  res.status(201).json({ data: category });
});

// @desc Update specific Category
// @route PUT /api/v1/categories/:id
// @access private
exports.updateCategory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { name } = req.body;
  const category = await CategoryMudel.findOneAndUpdate(
    { _id: id },
    { 
      name: name,
      slung: slugify(name),
    },
    { new: true }
  );
  if (!category) {
    return next(new ApiErrore(`No category for this id ${id}`, 404));
  } 
  res.status(200).json({ data: category });
});

// @desc Delete specific category
// @route DELETE /api/v1/categories/:id
// @access private
exports.deleteCategory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const category = await CategoryMudel.findByIdAndDelete(
    { _id: id },
  )
  if (!category) {
    return next(new ApiErrore(`No category for this id ${id}`, 404));
  } 
  res.status(200).json({ data: category });
});