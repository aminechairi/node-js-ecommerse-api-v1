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

const globalErrore = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || `error`;
  if (process.env.NODE_ENV === `development`) {
    sendErroreForDev(err, res);
  } else {
    sendErroreForProd(err, res);
  };
};

module.exports = globalErrore;