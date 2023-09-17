const categoryRoutes = require(`./categoryRoute`);
const subCategoryRoutes = require('./subCategoryRoute');
const brandRoutes = require("./brandRoute");
const productRoutes = require("./productRoute");
const userRoutes = require("./userRoute");
const authRoutes = require("./authRoute");
const reviewRoutes = require("./reviewRoute");
const wishListRoutes = require("./wishlistRoute");
const addressRoutes = require("./addressRoute");
const couponRoutes = require("./couponRoute");
const cartRoutes = require("./cartRoute");

const mountRoutes = (app) => {
  app.use(`/api/v1/categories`, categoryRoutes);
  app.use(`/api/v1/subcategories`, subCategoryRoutes);
  app.use(`/api/v1/brands`, brandRoutes);
  app.use(`/api/v1/products`, productRoutes);
  app.use(`/api/v1/users`, userRoutes);
  app.use(`/api/v1/auth`, authRoutes);
  app.use(`/api/v1/reviews`, reviewRoutes);
  app.use(`/api/v1/wishlist`, wishListRoutes);
  app.use(`/api/v1/addresses`, addressRoutes);
  app.use(`/api/v1/coupons`, couponRoutes);
  app.use(`/api/v1/cart`, cartRoutes);
};

module.exports = mountRoutes;