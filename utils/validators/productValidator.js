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
    .custom((_, { req }) => {
      if (!(req.body.imageCover === undefined)) {
        throw new Error('The field you entered for ImageCover is not an Image type.');
      };
      return true;
    }),

  check("images")
    .custom((_, { req }) => {
      if (!(req.body.images === undefined)) {
        throw new Error('The field you entered for Images is not an Image type.');
      };
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

  check("subCategories")
    .notEmpty()
    .withMessage('Sub categories is required.')
    .isArray()
    .withMessage("Product sub categories must be an array.")
    .custom((value) => {
      if (!( Array.isArray(value) && value.every(isValidObjectId) )) {
        if (value.length > 1) {
          throw new Error('Invalid sub categories ids formate.');
        } else {
          throw new Error('Invalid sub category id formate.')
        };
      };
      return true;
    })
    .custom(async (subCategoriesIds) => {
      if (subCategoriesIds.length > 0) {
        const subCategories = await subCategoryModel.find({
          _id: { $in: subCategoriesIds },
        });
        if (subCategories.length !== subCategoriesIds.length) {
          if (subCategoriesIds.length > 1) {
            throw new Error(`No sub categories for this ids ${subCategoriesIds}.`);
          } else {
            throw new Error(`No sub category for this id ${subCategoriesIds}.`);
          };
        } else {
          return true;
        };
      } else {
        return true;
      };
    })
    .custom(async (subCategoriesIds, { req }) => {
      // step 1
      const subCategories = await subCategoryModel.find({
        category: req.body.category,
      });
      // step 2
      const listSubCategoriesIds = [];
      for (let i = 0; i < subCategories.length; i++) {
        listSubCategoriesIds.push(subCategories[i]._id.toString());
      };
      // step 3
      const check = subCategoriesIds.every((el) => {
        return listSubCategoriesIds.includes(el);
      });
      // step 4
      if (!check) {
        if (subCategoriesIds.length > 1) {
          throw new Error('Sub categories not belong to category.');
        } else {
          throw new Error('Sub category not belong to category.');
        };
      };
      return true;
    }),

  check("underSubCategories")
    .optional()
    .isArray()
    .withMessage("Product under sub categories must be an array.")
    .custom((value) => {
      if (!( Array.isArray(value) && value.every(isValidObjectId) )) {
        if (value.length > 1) {
          throw new Error('Invalid under sub categories ids formate.');
        } else {
          throw new Error('Invalid under sub category id formate.');
        };
      };
      return true;
    })
    .custom(async (underSubCategoriesIds) => {
      if (underSubCategoriesIds.length > 0) {
        const underSubCategories = await underSubCategoryModel.find({
          _id: { $in: underSubCategoriesIds },
        });
        if (underSubCategories.length !== underSubCategoriesIds.length) {
          if (underSubCategories.length > 1) {
            throw new Error(`No under sub categories for this ids ${underSubCategoriesIds}.`);
          } else {
            throw new Error(`No under sub category for this id ${underSubCategoriesIds}.`);
          };
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
        subCategory: { $in: req.body.subCategories },
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
        if (underSubCategoriesIds.length > 1) {
          throw new Error('Under sub categories not belong to sub categories.');
        } else {
          throw new Error('Under sub category not belong to sub categories.');
        };
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
    .withMessage("Invalid product id formate.")
    .custom(async (value, { req }) => {
      const product = await productModel.findById(value);
      if (!product) {
        throw new Error(`No product for this id ${value}.`);
      };
    }),

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
    .custom((_, { req }) => {
      if (!(req.body.imageCover === undefined)) {
        throw new Error('The field you entered for ImageCover is not an Image type.');
      };
      return true;
    }),

  check("images")
    .custom((_, { req }) => {
      if (!(req.body.images === undefined)) {
        throw new Error('The field you entered for Images is not an Image type.');
      };
      return true;
    }),

  check("category")
    .optional()
    .isMongoId()
    .withMessage("Invalid category id formate.")
    .custom((_, { req }) => {
      if (!req.body.subCategories) {
        throw new Error(`You must update sub categories.`);
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

  check("subCategories")
    .optional()
    .isArray()
    .withMessage("Product sub categories must be an array.")
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
    .custom((value) => {
      if (!( Array.isArray(value) && value.every(isValidObjectId) )) {
        if (value.length > 1) {
          throw new Error('Invalid sub categories ids formate.');
        } else {
          throw new Error('Invalid sub category id formate.')
        };
      };
      return true;
    })
    .custom(async (subCategoriesIds) => {
      if (subCategoriesIds.length > 0) {
        const subCategories = await subCategoryModel.find({
          _id: { $in: subCategoriesIds },
        });
        if (subCategories.length !== subCategoriesIds.length) {
          if (subCategoriesIds.length > 1) {
            throw new Error(`No sub categories for this ids ${subCategoriesIds}.`);
          } else {
            throw new Error(`No sub category for this id ${subCategoriesIds}.`);
          };
        } else {
          return true;
        };
      } else {
        return true;
      };
    })
    .custom(async (subCategoriesIds, { req }) => {
      let product;
      if (!req.body.category) {
        product = await productModel.findById(req.params.id);
        if (!product) {
          throw new Error(`No product for this id ${req.params.id}`);
        };
      };
      // step 1
      const subCategories = await subCategoryModel.find({
        category: req.body.category || product.category._id,
      });
      // step 2
      const listSubCategoriesIds = [];
      for (let i = 0; i < subCategories.length; i++) {
        listSubCategoriesIds.push(subCategories[i]._id.toString());
      };
      // step 3
      const check = subCategoriesIds.every((el) => {
        return listSubCategoriesIds.includes(el);
      });
      // step 4
      if (!check) {
        if (subCategoriesIds.length > 1) {
          throw new Error('Sub categories not belong to category.');
        } else {
          throw new Error('Sub category not belong to category.');
        };
      };
      return true;
    }),

  check("underSubCategories")
    .optional()
    .isArray()
    .withMessage("Product under sub categories must be an array.")
    .custom((value) => {
      if (!( Array.isArray(value) && value.every(isValidObjectId) )) {
        if (value.length > 1) {
          throw new Error('Invalid under sub categories ids formate.');
        } else {
          throw new Error('Invalid under sub category id formate.');
        };
      };
      return true;
    })
    .custom(async (underSubCategoriesIds) => {
      if (underSubCategoriesIds.length > 0) {
        const underSubCategories = await underSubCategoryModel.find({
          _id: { $in: underSubCategoriesIds },
        });
        if (underSubCategories.length !== underSubCategoriesIds.length) {
          if (underSubCategories.length > 1) {
            throw new Error(`No under sub categories for this ids ${underSubCategoriesIds}.`);
          } else {
            throw new Error(`No under sub category for this id ${underSubCategoriesIds}.`);
          };
        } else {
          return true;
        };
      } else {
        return true;
      };
    })
    .custom(async (underSubCategoriesIds, { req }) => {
      let product;
      if (!req.body.subCategories) {
        product = await productModel.findById(req.params.id);
        if (!product) {
          throw new Error(`No product for this id ${req.params.id}.`);
        }
      };
      // step 1
      const underSubcategories = await underSubCategoryModel.find({
        subCategory: { $in: req.body.subCategories || product.subCategories },
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
        if (underSubCategoriesIds.length > 1) {
          throw new Error('Under sub categories not belong to sub categories.');
        } else {
          throw new Error('Under sub category not belong to sub categories.');
        };
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

exports.imageValidator = [
  check("imageCover")
    .notEmpty()
    .withMessage("Product image cover is required."),

  validatorMiddleware,
];