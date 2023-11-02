const { check } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const slugify = require("slugify");

const categoryModel = require(`../../models/categoryModel`);
const subCategoryModel = require("../../models/subCategoryModel");
const underSubCategoryModel = require('../../models/underSubCategoryModel');
const brandModel = require("../../models/brandModel");
const productModel = require("../../models/productModel");

const mongoose = require('mongoose');

// Custom validation function for MongoDB ObjectID
const isValidObjectId = value => mongoose.Types.ObjectId.isValid(value);

exports.createProductValidator = [
  check("uniqueName")
    .notEmpty()
    .withMessage("Product unique name is required.")
    .isString()
    .withMessage("Product unique name must be of type string.")
    .isLength({ min: 3 })
    .withMessage("Too short product unique name.")
    .isLength({ max: 32 })
    .withMessage("Too long product unique name."),

  check("title")
    .notEmpty()
    .withMessage("Product title is required.")
    .isString()
    .withMessage("Product title must be of type string.")
    .isLength({ min: 3 })
    .withMessage("Too short product title.")
    .isLength({ max: 200 })
    .withMessage("Too long product title.")
    .custom((value, { req }) => {
      req.body.slug = `${slugify(value)}`.toLowerCase();
      return true;
    }), 

  check("description")
    .notEmpty()
    .withMessage("Product description is required.")
    .isString()
    .withMessage("Product description must be of type string.")
    .isLength({ min: 32 })
    .withMessage("Too short product description."),

  check("quantity")
    .notEmpty()
    .withMessage("Product quantity is required.")
    .isNumeric()
    .withMessage("Product quantity must be of type number.")
    .isInt({ min: 1, })
    .withMessage("Prodact quantity number cannot be less than 1 and must be a integer number."),

  check("sold")
    .optional()
    .isNumeric()
    .withMessage("Product sold must be of type number.")
    .isInt({ min: 0, })
    .withMessage("Prodact sold number cannot be less than 0 and must be a integer number."),

  check("price")
    .notEmpty()
    .withMessage("Product price is required.")
    .isNumeric()
    .withMessage("Product price must be of type number.")
    .isFloat({ min: 0, })
    .withMessage("Prodact price number cannot be less than 0."),

  check("priceAfterDiscount")
    .optional()
    .isNumeric()
    .withMessage("Product price after discount must be of type number.")
    .isFloat({ min: 0, })
    .withMessage("Prodact price after discount number cannot be less than 0.")
    .custom((value, { req }) => {
      if (+req.body.price <= +value) {
        throw new Error("Prodact price after discount must be lower than price.");
      };
      return true;
    }),

  check("color")
    .optional()
    .isString()
    .withMessage("Product color name must be of type string.")
    .isLength({ min: 3 })
    .withMessage("Too short product color name.")
    .isLength({ max: 32 })
    .withMessage("Too long product color name."),

  check("imageCover")
    .notEmpty()
    .withMessage("Product image cover is required.")
    .isString()
    .withMessage("Product image cover must be of type string."),

  check("images")
    .optional()
    .isArray()
    .withMessage("Product images must be an array.")
    .custom(images => {
      for (const image of images) {
        if (typeof image !== 'string') {
          throw new Error("Product images must be of type string.");
        }
      }
      return true;
    }),

  check("category")
    .notEmpty()
    .withMessage("Product must be belong to a category.")
    .isMongoId()
    .withMessage("Invalid category id formate.")
    .custom(async (_, { req }) => {
      const ObjectId = req.body.category;
      const category = await categoryModel.findById(ObjectId);
      if (category) {
        return true;
      } else {
        throw new Error(`No category for this id ${ObjectId}.`);
      };
    }),

    check("subCategory")
    .notEmpty()
    .withMessage("Product must be belong to a sub category.")
    .isMongoId()
    .withMessage("Invalid sub category id formate.")
    .custom(async (_, { req }) => {
      const ObjectId = req.body.subCategory;
      const subCategory = await subCategoryModel.findById(ObjectId);
      if (subCategory) {
        return true;
      } else {
        throw new Error(`No sub category for this id ${ObjectId}.`);
      };
    })
    .custom(async (_, { req }) => {
     const subCategoryId = req.body.subCategory;
      const categoryId = req.body.category;
      const subCategory = await subCategoryModel.findOne({
        _id: subCategoryId,
        category: categoryId,
      });
      if (!subCategory) {
        throw new Error(`Sub category not belomg category.`);
      };
      return true;
    }),

    check("underSubCategories")
    .optional()
    .isArray()
    .withMessage("Product under sub categories must be an array.")
    .custom((value) => {
      if (!( Array.isArray(value) && value.every(isValidObjectId) )) {
        throw new Error(` ${
          value.length > 1 
          ? 'Invalid under sub categories ids formqte.'
          : 'Invalid under sub category id formqte.'
        }`);
      };
      return true;
    })
    .custom(async (underSubCategoriesIds) => {
      if (underSubCategoriesIds.length > 0) {
        const underSubCategories = await underSubCategoryModel.find({
          _id: { $in: underSubCategoriesIds },
        });
        if (underSubCategories.length !== underSubCategoriesIds.length) {
          throw new Error(
            `Invalid ${
              underSubCategoriesIds.length > 1 ? 
              `under sub categories ids` : 
              `under sub category id`
            } ${underSubCategoriesIds}.`
          );
        } else {
          return true;
        };
      } else {
        return true;
      };
    })
    .custom(async (underSubCategoriesIds, { req }) => {
      // step 1
      const underSubcategories = await underSubCategoryModel.find({
        subCategory: req.body.subCategory,
      });
      // step 2
      const listUnderSubCategoriesIds = [];
      for (let i = 0; i < underSubcategories.length; i++) {
        listUnderSubCategoriesIds.push(underSubcategories[i]._id.toString());
      };
      // step 3
      const check = underSubCategoriesIds.every((el) => {
        return listUnderSubCategoriesIds.includes(el);
      });
      // step 4
      if (!check) {
        throw new Error(`${
          underSubCategoriesIds.length > 1
          ? "Under sub categories"
          : "Under sub category"
        } not belong to sub category.`);
      };
      return true;
    }),

  check("brand")
    .optional()
    .isMongoId()
    .withMessage("Invalid brand id formate.")
    .custom(async (value, { req }) => {
      const ObjectId = req.body.brand;
      const brand = await brandModel.findById(ObjectId);
      if (brand) {
        return true;
      } else {
        throw new Error(`No brand for this id ${ObjectId}.`);
      }
    }),

  check("ratingsAverage")
    .optional()
    .isNumeric()
    .withMessage("Rating average must be of type number.")
    .isFloat({ min: 1 })
    .withMessage("Rating must be above or equal 1.0")
    .isFloat({ max: 5 })
    .withMessage("Rating must be below or equal 5.0"),

  check("ratingsQuantity")
    .optional()
    .isNumeric()
    .withMessage("Rating quantity must be of type number.")
    .isInt({ min: 0, })
    .withMessage("Rating quantity number cannot be less than 0 and must be a integer number."),

  validatorMiddleware,
];

exports.getProductValidator = [
  check("id")
    .isMongoId()
    .withMessage("Invalid product id formate."),
  validatorMiddleware,
];

exports.updateProductValidator = [
  check("id")
    .isMongoId()
    .withMessage("Invalid product id formate."),

    check("uniqueName")
    .optional()
    .isString()
    .withMessage("Product unique name must be of type string.")
    .isLength({ min: 3 })
    .withMessage("Too short product unique name.")
    .isLength({ max: 32 })
    .withMessage("Too long product unique name."),

    check("title")
    .optional()
    .isString()
    .withMessage("Product title must be of type string.")
    .isLength({ min: 3 })
    .withMessage("Too short product title.")
    .isLength({ max: 200 })
    .withMessage("Too long product title.")
    .custom((value, { req }) => {
      req.body.slug = `${slugify(value)}`.toLowerCase();
      return true;
    }),

  check("description")
    .optional()
    .isString()
    .withMessage("Product description must be of type string.")
    .isLength({ min: 32 })
    .withMessage("Too short product description."),

  check("quantity")
    .optional()
    .isNumeric()
    .withMessage("Product quantity must be of type number.")
    .isInt({ min: 1, })
    .withMessage("Prodact quantity number cannot be less than 1 and must be a integer number."),

  check("sold")
    .optional()
    .isNumeric()
    .withMessage("Product sold must be of type number.")
    .isInt({ min: 0, })
    .withMessage("Prodact sold number cannot be less than 0 and must be a integer number."),

  check("price")
    .optional()
    .isNumeric()
    .withMessage("Product price must be of type number.")
    .isFloat({ min: 0, })
    .withMessage("Prodact price number cannot be less than 0."),

  check("priceAfterDiscount")
    .optional()
    .isNumeric()
    .withMessage("Product price after discount must be of type number.")
    .isFloat({ min: 0, })
    .withMessage("Prodact price after discount number cannot be less than 0.")
    .custom(async (value, { req }) => {
      const product = await productModel.findById(req.params.id);
      if (!product) {
        throw new Error(`No product for this id ${req.params.id}`);
      }
      if (product.price <= +value) {
        throw new Error("Prodact price after discount must be lower than price.");
      }
      return true;
    }),

  check("color")
    .optional()
    .isString()
    .withMessage("Product color name must be of type string.")
    .isLength({ min: 3 })
    .withMessage("Too short product color name.")
    .isLength({ max: 32 })
    .withMessage("Too long product color name."),

  check("imageCover")
    .optional()
    .isString()
    .withMessage("Product image cover must be of type string."),

  check("images")
    .optional()
    .isArray()
    .withMessage("Product images must be an array.")
    .custom(images => {
      for (const image of images) {
        if (typeof image !== 'string') {
          throw new Error("Product images must be of type string.");
        }
      }
      return true;
    }),

  check("category")
    .optional()
    .isMongoId()
    .withMessage("Invalid category id formate.")
    .custom((_, { req }) => {
      if (!req.body.subCategory) {
        throw new Error(`You must update sub category.`);
      };
      return true;
    })
    .custom((_, { req }) => {
      if (!req.body.underSubCategories) {
        throw new Error(`You must update under sub categories.`);
      };
      return true;
    })
    .custom(async (_, { req }) => {
      const ObjectId = req.body.category;
      const category = await categoryModel.findById(ObjectId);
      if (category) {
        return true;
      } else {
        throw new Error(`No category for this id ${ObjectId}.`);
      }
    }),

    check("subCategory")
    .optional()
    .isMongoId()
    .withMessage("Invalid sub category id formate.")
    .custom((_, { req }) => {
      if (!req.body.category) {
        throw new Error(`You must update category.`);
      };
      return true;
    })
    .custom((_, { req }) => {
      if (!req.body.underSubCategories) {
        throw new Error(`You must update under sub categories.`);
      };
      return true;
    })
    .custom(async (_, { req }) => {
      const ObjectId = req.body.subCategory;
      const subCategory = await subCategoryModel.findById(ObjectId);
      if (subCategory) {
        return true;
      } else {
        throw new Error(`No sub category for this id ${ObjectId}.`);
      };
    })
    .custom(async (_, { req }) => {
      const categoryId = req.body.category;
      const subCategoryId = req.body.subCategory;
      let product;
      if (!categoryId) {
        product = await productModel.findById(req.params.id);
        if (!product) {
          throw new Error(`No product for this id ${req.params.id}`);
        }
      };
      const subCategory = await subCategoryModel.findOne({
        _id: subCategoryId,
        category: categoryId || product.category._id,
      });
      if (!subCategory) {
        throw new Error(`Sub category not belomg category.`);
      };
      return true;
    }),

    check("underSubCategories")
    .optional()
    .isArray()
    .withMessage("Product under sub categories must be an array.")
    .custom((value) => {
      if (!( Array.isArray(value) && value.every(isValidObjectId) )) {
        throw new Error(` ${
          value.length > 1 
          ? 'Invalid under sub categories ids formate.'
          : 'Invalid under sub category id formate.'
        }`);
      };
      return true;
    })
    .custom(async (underSubCategoriesIds) => {
      if (underSubCategoriesIds.length > 0) {
        const underSubCategories = await underSubCategoryModel.find({
          _id: { $in: underSubCategoriesIds },
        });
        if (underSubCategories.length !== underSubCategoriesIds.length) {
          throw new Error(
            `Invalid ${
              underSubCategoriesIds.length > 1 ? 
              `under sub categories ids` : 
              `under sub category id`
            } ${underSubCategoriesIds}.`
          );
        } else {
          return true;
        };
      } else {
        return true;
      };
    })
    .custom(async (underSubCategoriesIds, { req }) => {
      let product;
      if (!req.body.subCategory) {
        product = await productModel.findById(req.params.id);
        if (!product) {
          throw new Error(`No product for this id ${req.params.id}`);
        }
      };
      // step 1
      const underSubcategories = await underSubCategoryModel.find({
        subCategory: req.body.subCategory || product.subCategory._id,
      });
      // step 2
      const listUnderSubCategoriesIds = [];
      for (let i = 0; i < underSubcategories.length; i++) {
        listUnderSubCategoriesIds.push(underSubcategories[i]._id.toString());
      };
      // step 3
      const check = underSubCategoriesIds.every((el) => {
        return listUnderSubCategoriesIds.includes(el);
      });
      // step 4
      if (!check) {
        throw new Error(`${
          underSubCategoriesIds.length > 1
          ? "Under sub categories"
          : "Under sub category"
        } not belong to sub category.`);
      };
      return true;
    }),

  check("brand")
    .optional()
    .isMongoId()
    .withMessage("Invalid brand id formate.")
    .custom(async (value, { req }) => {
      const ObjectId = req.body.brand;
      const brand = await brandModel.findById(ObjectId);
      if (brand) {
        return true;
      } else {
        throw new Error(`No brand for this id ${ObjectId}.`);
      }
    }),

  check("ratingsAverage")
    .optional()
    .isNumeric()
    .withMessage("Rating average must be of type number.")
    .isFloat({ min: 1 })
    .withMessage("Rating must be above or equal 1.0")
    .isFloat({ max: 5 })
    .withMessage("Rating must be below or equal 5.0"),

  check("ratingsQuantity")
    .optional()
    .isNumeric()
    .withMessage("Rating quantity must be of type number.")
    .isInt({ min: 0, })
    .withMessage("Rating quantity number cannot be less than 0 and must be a integer number."),

  validatorMiddleware,
];

exports.deleteProductValidator = [
  check("id")
    .isMongoId()
    .withMessage("Invalid product id formate."),
  validatorMiddleware,
]; 