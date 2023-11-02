const fs = require('fs');
const path = require("path");

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

exports.getOne = (Model, populationOpt) =>
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    // 1) Build query
    let query = Model.findById(id);
    if (populationOpt) {
      query = query.populate(populationOpt);
    };

    // 2) Execute query
    const document = await query;

    if (!document) {
      return next(new ApiError(`No document for this id ${id}`, 404));
    }
    res.status(200).json({ data: document });
  });

exports.createOne = (model) =>
  asyncHandler(async (req, res) => {
    const document = await model.create(req.body);
    res.status(201).json({
      data: document,
    });
  });

exports.updateOne = (models, name) =>
  asyncHandler(async (req, res, next) => {

    const { id } = req.params;
    const body = req.body;

    if (body.image) {

      let document = await models.findByIdAndUpdate(
        id,
        body,
      );
      if (!document) {
        return next(new ApiError(`No document for this id ${id}`, 404));
      };

      const imageUrl = document.image;
      const baseUrl = `${process.env.BASE_URL}/${name}/`;
      const imageName = imageUrl.replace(baseUrl, '');
      const imagePath = path.join(__dirname, '..', 'uploads', name, `${imageName}`);
      
      fs.unlink(imagePath, (err) => {});

      document = await models.find({ _id: id });
      res.status(200).json({ data: document[0] });

    } else {

      const document = await models.findByIdAndUpdate(
        id,
        body,
        { new:true }
      );
      if (!document) {
        return next(new ApiError(`No document for this id ${id}`, 404));
      };

      res.status(200).json({ data: document });

    };

  });

exports.deleteOne = (models, name) =>
  asyncHandler(async (req, res, next) => {

    const { id } = req.params;

    const document = await models.findByIdAndDelete({ _id: id });
    if (!document) {
      return next(new ApiError(`No document for this id ${id}`, 404));
    };

    if (!name) {
      res.status(200).json({ data: document });
    } else {

      const imageUrl = document.image;
      const baseUrl = `${process.env.BASE_URL}/${name}/`;
      const imageName = imageUrl.replace(baseUrl, '');
      const imagePath = path.join(__dirname, '..', 'uploads', name, `${imageName}`);
      
      fs.unlink(imagePath, (err) => {});

      res.status(200).json({ data: document });
    };

  });