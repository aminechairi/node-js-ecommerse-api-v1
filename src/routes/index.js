const categoryRoutes = require(`./categoryRoute`);
const subCategoryRoutes = require("./subCategoryRoute");
const underSubCategoryRoutes = require("./underSubCategoryRoute");
const brandRoutes = require("./brandRoute");
const productRoutes = require("./productRoute");
const productsGroupRoute = require("./productsGroupRoute");
const userRoutes = require("./userRoute");
const authRoutes = require("./authRoute");
const reviewRoutes = require("./reviewRoute");
const savetRoutes = require("./saveRoute");
const couponRoutes = require("./couponRoute");
const cartRoutes = require("./cartRoute");
const orderRoutes = require("./orderRoute");
const appSettingsRoutes = require("./appSettingsRoute");

const mountRoutes = (app) => {
  app.use(`/api/v1/categories`, categoryRoutes);
  app.use(`/api/v1/subcategories`, subCategoryRoutes);
  app.use(`/api/v1/undersubcategories`, underSubCategoryRoutes);
  app.use(`/api/v1/brands`, brandRoutes);
  app.use(`/api/v1/products`, productRoutes);
  app.use(`/api/v1/productsgroups`, productsGroupRoute);
  app.use(`/api/v1/users`, userRoutes);
  app.use(`/api/v1/auth`, authRoutes);
  app.use(`/api/v1/reviews`, reviewRoutes);
  app.use(`/api/v1/saves`, savetRoutes);
  app.use(`/api/v1/coupons`, couponRoutes);
  app.use(`/api/v1/cart`, cartRoutes);
  app.use(`/api/v1/orders`, orderRoutes);
  app.use(`/api/v1/appsettings`, appSettingsRoutes);
};

module.exports = mountRoutes;
