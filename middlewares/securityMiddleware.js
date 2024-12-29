var cors = require("cors");
const compression = require("compression");
const rateLimit = require('express-rate-limit');
var hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

function addSecurityMiddlewares(app) {
  // Enable other domains to access your application
  app.use(cors());
  app.options("*", cors()); // include before other routes

  // compress all responses
  app.use(compression());

  // To apply data sanitization
  app.use(mongoSanitize());
  app.use(xss());

  // // Apply rate limiting middleware
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      status: "fail",
      message: "Too many requests, please try again later.",
    },
  });
  // Apply rate limiting middleware Tto all requests
  app.use("/api", limiter);

  app.use(hpp());

  // Log security-related middleware setup
  console.log("Security middlewares added successfully.");
}

module.exports = addSecurityMiddlewares;
