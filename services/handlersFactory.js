const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../config/s3Client');
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiErrore");
const ApiFeatures = require("../utils/apiFeatures");

const awsBuckName = process.env.AWS_BUCKET_NAME;

exports.resizeImage = (names, width, height) => 
  asyncHandler(async (req, _, next) => {

    if (req.file) {

      const imageFormat = 'jpeg';

      const buffer = await sharp(req.file.buffer)
      .resize(width, height)
      .toFormat(imageFormat)
      .jpeg({ quality: 100 })
      .toBuffer();

      const imageName = `${names[1]}-${uuidv4()}-${Date.now()}.${imageFormat}`;

      const params = {
        Bucket: awsBuckName,
        Key: `${names[0]}/${imageName}`,
        Body: buffer,
        ContentType: `image/${imageFormat}`,
      };

      const command = new PutObjectCommand(params);
      await s3Client.send(command);

      // Save image name to Into Your db
      req.body.image = imageName;

    };

    next();
  });

exports.getAll = (model, modelName) =>
  asyncHandler(async (req, res) => {

    let filter = {};

    if (req.filterObj) {
      filter = req.filterObj;
    };

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
    };

    res.status(200).json({ data: document });

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

      const imageUrl = `${document.image}`;
      const baseUrl = `${process.env.AWS_BASE_URL}/`;
      const restOfUrl = imageUrl.replace(baseUrl, '');
      const key = restOfUrl.slice(0, restOfUrl.indexOf('?'));
    
      const params = {
        Bucket: awsBuckName,
        Key: key,
      };

      const command = new DeleteObjectCommand(params);
      await s3Client.send(command);

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

exports.deleteOne = (models, containsImage = false) =>
  asyncHandler(async (req, res, next) => {

    const { id } = req.params;

    const document = await models.findByIdAndDelete({ _id: id });
    if (!document) {
      return next(new ApiError(`No document for this id ${id}`, 404));
    };

    if (!containsImage) {
      res.status(200).json({ data: document });
    } else {

      const imageUrl = `${document.image}`;
      const baseUrl = `${process.env.AWS_BASE_URL}/`;
      const restOfUrl = imageUrl.replace(baseUrl, '');
      const key = restOfUrl.slice(0, restOfUrl.indexOf('?'));
    
      const params = {
        Bucket: awsBuckName,
        Key: key,
      };

      const command = new DeleteObjectCommand(params);
      await s3Client.send(command);

      res.status(200).json({ data: document });
    };

  });