const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiErrore");
const ApiFeatures = require("../utils/apiFeatures");

exports.getAll = (model, modelName) =>
  asyncHandler(async (req, res) => {
    let filter = {};
    if (req.filterObj) {
      filter = req.filterObj;
    }
    // Get count of products
    const countDocuments = await model.countDocuments();
    // Build query
    const apiFeatures = new ApiFeatures(model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields(modelName)
      .search(modelName)
      .paginate(countDocuments);
    // Execute Query
    const { mongooseQuery, paginationResults } = apiFeatures;
    const document = await mongooseQuery;
    res.status(200).json({
      result: document.length,
      paginationResults,
      data: document,
    });
  });

exports.getOne = (model) =>
  asyncHandler(async (req, res, next) => {
    const document = await model.findById(req.params.id);
    if (!document) {
      return next(
        new ApiError(`No document for this id ${req.params.id}`, 404)
      );
    }
    res.status(200).json({
      data: document,
    });
  });

exports.createOne = (model) =>
  asyncHandler(async (req, res) => {
    const document = await model.create(req.body);
    res.status(201).json({
      data: document,
    });
  });

exports.updateOne = (models) =>
  asyncHandler(async (req, res, next) => {
    const document = await models.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!document) {
      return next(new ApiError(`No document for this id ${req.params.id}`, 404));
    }
    res.status(200).json({
      data: document,
    });
  });

exports.deleteOne = (models) =>
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const document = await models.findByIdAndDelete({ _id: id });
    if (!document) {
      return next(new ApiError(`No document for this id ${id}`, 404));
    }
    res.status(200).json({ data: document });
  });