const path = require("path");

const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");

dotenv.config({path: "./config.env"});
const ApiErrore = require("./utils/apiErrore");
const globalErrore = require("./middlewares/erroreMiddleware");
const dbConection = require(`./config/database`);
// Routes
const categoryRoutes = require(`./routes/categoryRoute`);
const subCategoryRoutes = require('./routes/subCategoryRoute');
const brandRoutes = require("./routes/brandRoute");
const productRoutes = require("./routes/productRoute");
const userRoutes = require("./routes/userRoute");
const authRoutes = require("./routes/authRoute");

// dbConnection
dbConection();

// express app
const app = express();

// middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, "uploads")));

if (process.env.NODE_ENV === `development`) {
  app.use(morgan("tiny"));
  console.log(
    `mode: ${process.env.NODE_ENV}`
  );
}

// Mounet Routes
app.use(`/api/v1/categories`, categoryRoutes);
app.use(`/api/v1/subcategories`, subCategoryRoutes);
app.use(`/api/v1/brands`, brandRoutes);
app.use(`/api/v1/products`, productRoutes);
app.use(`/api/v1/users`, userRoutes);
app.use(`/api/v1/auth`, authRoutes);

app.all(`*`, (req, res, next) => {
  next(new ApiErrore(`can't find this rout: ${req.originalUrl}`, 400));
});

// Global error handling middleware
app.use(globalErrore);

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, _ => {
  console.log(
    `app runnig on port ${PORT}`
  );
});

// handle rejection outside express
process.on("unhandledRejection", (err) => {
  console.error(`unhandledRejection Erorr: ${err.name} | ${err.message}`);
  server.close(() => {
    console.log("Shutting down...");
    process.exit(1);
  });
}); 