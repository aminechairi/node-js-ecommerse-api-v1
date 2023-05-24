const { 
  deleteOne,
  updateOne,
  createOne,
  getOne,
  getAll,
} = require("./handlersFactory");

const brandMudel = require("../models/brandModel");

// @desc Get List Of Brands
// @route GET /api/v1/brands
// @access Public
exports.getBrands = getAll(brandMudel);
// exports.getBrands = asyncHandler(async (req, res) => {
//   // get count of products
//   const countDocuments = await brandMudel.countDocuments();
//   // build query
//   const apiFeatures = new ApiFeatures(brandMudel.find(), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .search()
//     .paginate(countDocuments);
//   // Execute Query
//   const { mongooseQuery, paginationResults } = apiFeatures;
//   const brands = await mongooseQuery;
//   res.status(200).json({
//     result: brands.length,
//     paginationResults,
//     data: brands,
//   });
// });

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