const ApiErrore = require("../utils/apiErrore");

const sendErroreForDev = (err, res) => {
  return res.status(err.statusCode).json({ 
    status: err.status,
    err: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErroreForProd = (err, res) => {
  return res.status(err.statusCode).json({ 
    status: err.status,
    message: err.message,
  });
};

const handleJwtInvalidSignature = () => {
  return new ApiErrore(`Invalid token plesse login again...`, 401);
};

const handleJwtExpired = () => {
    return new ApiErrore(`Expired token plesse login again...`, 401);
};

const globalErrore = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || `error`;
  if (process.env.NODE_ENV === `development`) {
    sendErroreForDev(err, res);
  } else {
    if (err.name === "JsonWebTokenError") {
      err = handleJwtInvalidSignature();
    }
    if (err.name === "TokenExpiredError") {
      err = handleJwtExpired();
    }
    sendErroreForProd(err, res);
  };
};

module.exports = globalErrore;