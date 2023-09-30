const { check } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const slugify = require("slugify");

const categoryModel = require(`../../models/categoryModel`);
const subCategoryModel = require("../../models/subCategoryModel");
const brandModel = require("../../models/brandModel");
const productModel = require("../../models/productModel");

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
    .custom(async (value, { req }) => {
      const ObjectId = req.body.category;
      const category = await categoryModel.findById(ObjectId);
      if (category) {
        return true;
      } else {
        throw new Error(`No category for this id ${ObjectId}.`);
      }
    }),

  check("subcategories")
    .optional()
    .isArray()
    .withMessage("Product subcategories must be an array.")
    .custom(async (subcategoriesIds) => {
      if (subcategoriesIds.length > 0) {
        const subcategories = await subCategoryModel.find({
          _id: { $in: subcategoriesIds },
        });
        if (subcategories.length !== subcategoriesIds.length) {
          throw new Error(
            `Invalid ${
              subcategoriesIds.length === 1 ? `subCategory id` : `subCategories ids`
            } ${subcategoriesIds}.`
          );
        } else {
          return true;
        }
      } else {
        return true;
      }
    })
    .custom(async (subcategoriesIds, { req }) => {
      // step 1
      const subcategories = await subCategoryModel.find({
        category: req.body.category,
      });
      // step 2
      const listSubcategoriesIds = [];
      for (let i = 0; i < subcategories.length; i++) {
        listSubcategoriesIds.push(subcategories[i]._id.toString());
      };
      // step 3
      const check = subcategoriesIds.every((el) => {
        return listSubcategoriesIds.includes(el);
      });
      // step 4
      if (!check) {
        throw new Error(`${
          req.body.subcategories.length > 1
          ? "subcategories"
          : "subcategory"
        } not belong to categories.`);
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
    .custom(async (val, { req }) => {
      const product = await productModel.findById(req.params.id);
      if (!product) {
        throw new Error(`No product for this id ${req.params.id}.`);
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
    .custom(async (value, { req }) => {
      if (!req.body.subcategories) {
        throw new Error(`You must update subcategories.`);
      }
      const ObjectId = req.body.category;
      const category = await categoryModel.findById(ObjectId);
      if (category) {
        return true;
      } else {
        throw new Error(`No category for this id ${ObjectId}.`);
      }
    }),

  check("subcategories")
    .optional()
    .isArray()
    .withMessage("Product subcategories must be an array.")
    .custom(async (subcategoriesIds) => {
      if (subcategoriesIds.length > 0) {
        const subcategories = await subCategoryModel.find({
          _id: { $in: subcategoriesIds },
        });
        if (subcategories.length !== subcategoriesIds.length) {
          throw new Error(
            `Invalid ${
              subcategoriesIds.length === 1 ? `subCategory id` : `subCategories ids`
            } ${subcategoriesIds}.`
          );
        } else {
          return true;
        }
      } else {
        return true;
      }
    })
    .custom(async (subcategoriesIds, { req }) => {
      let product;
      if (!req.body.category) {
        product = await productModel.findById(req.params.id);
      };
      const subcategories = await subCategoryModel.find({
        category: req.body.category || product.category._id,
      });
      const listSubcategoriesIds = [];
      for (let i = 0; i < subcategories.length; i++) {
        listSubcategoriesIds.push(subcategories[i]._id.toString());
      };
      const check = subcategoriesIds.every((el) => {
        return listSubcategoriesIds.includes(el);
      });
      if (!check) {
        throw new Error(`${
          req.body.subcategories.length > 1
          ? "subcategories"
          : "subcategory"
        } not belong to categories.`);
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