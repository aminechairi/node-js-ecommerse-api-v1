const { 
  deleteOne,
  updateOne,
  createOne,
  getOne,
  getAll,
} = require("./handlersFactory");

const categoryMudel = require(`../models/categoryModel`);

// @desc Get List Of Categories
// @route GET /api/v1/categories
// @access Public
exports.getCategories = getAll(categoryMudel);
// exports.getCategories = asyncHandler(async (req, res) => {
//   // get count of products
//   const countDocuments = await categoryMudel.countDocuments();
//   // build query
//   const apiFeatures = new ApiFeatures(categoryMudel.find(), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .search()
//     .paginate(countDocuments);
//   // Execute Query
//   const { mongooseQuery, paginationResults } = apiFeatures;
//   const categories = await mongooseQuery;
//   res.status(200).json({
//     result: categories.length,
//     paginationResults,
//     data: categories,
//   });
// });

// @desc Get Category by id
// @route GET /api/v1/categories/:id
// @access Public
exports.getCategory = getOne(categoryMudel);

// @desc Create Category
// @route POST /api/v1/categories
// @access private
exports.createCategories = createOne(categoryMudel);

// @desc Update specific Category
// @route PUT /api/v1/categories/:id
// @access private
exports.updateCategory = updateOne(categoryMudel);

// @desc Delete specific category
// @route DELETE /api/v1/categories/:id
// @access private
exports.deleteCategory = deleteOne(categoryMudel);