const path = require("path");

const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
var cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
var hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

dotenv.config({path: "./config.env"});
const ApiErrore = require("./utils/apiErrore");
const globalErrore = require("./middlewares/erroreMiddleware");
const dbConection = require(`./config/database`);

// Routes
const mountRoutes = require("./routes");
const { webhookCheckout } = require('./services/orderServise');

// dbConnection
dbConection();

// express app
const app = express();

// Enable other domains to access your application
app.use(cors());
app.options('*', cors()); // include before other routes

// compress all responses
app.use(compression());

// Checkout webhook
app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  webhookCheckout
);

// middlewares
app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname, "uploads")));

if (process.env.NODE_ENV === `development`) {
  app.use(morgan("tiny"));
  console.log(
    `mode: ${process.env.NODE_ENV}`
  );
};

// To apply data sanitization
app.use(mongoSanitize());
app.use(xss());

// Apply rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    message: 'Too many requests, please try again later.'
  },
});
// Apply rate limiting middleware Tto all requests
app.use('/api', limiter);

app.use(hpp());

// Mounet Routes
mountRoutes(app);

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