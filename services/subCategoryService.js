const slugify = require("slugify");
const asyncHandler = require("express-async-handler");
const ApiErrore = require("../utils/apiErrore");

const subCategoryModel = require("../models/subCategoryModel");

// @desc Get List Of subCategories
// @route GET /api/v1/subcategories
// @access Public
exports.getSubCategories = asyncHandler(async (req, res) => {
  let page = +req.query.page || 1;
  let limit = +req.query.limit || 4;
  let skip = (page - 1) * limit;
  let filterObject = {};
  if (req.params.categoryId) {
    filterObject = { category: req.params.categoryId };
  }
  const subCategories = await subCategoryModel
    .find(filterObject)
    .skip(skip)
    .limit(limit)
    // .populate({
    //   path: "category",
    //   select: "name -_id",
    // });
  res.status(200).json({ result: subCategories.length, page, data: subCategories });
});

// @desc Get subCategory by id
// @route GET /api/v1/subcategories/:id
// @access Public
exports.getSubCategory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const subCategory = await subCategoryModel
    .findById(id)
    // .populate({
    //   path: "category",
    //   select: "name -_id",
    // });
  if (!subCategory) {
    return next(new ApiErrore(`No subcategory for this id ${id}`, 404));
  }
  res.status(200).json({ data: subCategory });
});


// @desc Create subCategory
// @route POST /api/v1/subcategories
// @access private
exports.setCategoryIdToBody = (req, res, next) => {
  if (!req.body.category) {
    req.body.category = req.params.categoryId;
  }
  next();
};
exports.createSubCategory = asyncHandler(async (req, res) => {
  const name = req.body.name;
  const category = req.body.category;
  const subCategory = await subCategoryModel.create({
    name: name,
    slung: slugify(name),
    category: category,
  });
  res.status(201).json({ data: subCategory });
});

// @desc Update specific subCategory
// @route PUT /api/v1/subcategories/:id
// @access private
exports.updateSubCategory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { name, category } = req.body;
  const subCategory = await subCategoryModel.findOneAndUpdate(
    { _id: id },
    { 
      name: name,
      slung: slugify(name),
      category: category,
    },
    { new: true },
  );
  if (!subCategory) {
    return next(new ApiErrore(`No subcategory for this id ${id}`, 404));
  }
  res.status(200).json({ data: subCategory });
});

// @desc Delete specific subcategory
// @route DELETE /api/v1/subcategories/:id
// @access private
exports.deleteSubCategory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const subCategory = await subCategoryModel.findByIdAndDelete(
    { _id: id },
  )
  if (!subCategory) {
    return next(new ApiErrore(`No subcategory for this id ${id}`, 404));
  }
  res.status(200).json({ data: subCategory });
});