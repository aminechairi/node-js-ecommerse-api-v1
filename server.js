const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");

dotenv.config({path: "./config.env"});
const dbConection = require(`./config/database`);
const categoryRoutes = require(`./routes/categoryRoutes`);

// dbConnection
dbConection();

// express app
const app = express();

// middlewares
app.use(express.json());

if (process.env.NODE_ENV === `development`) {
  app.use(morgan("tiny"));
  console.log(
    `mode: ${process.env.NODE_ENV}`
  );
}

// Mounet Routes
app.use(`/api/v1/categories`, categoryRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, _ => {
  console.log(
    `app runnig on port ${PORT}`
  );
});