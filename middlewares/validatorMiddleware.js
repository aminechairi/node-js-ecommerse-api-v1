const { validationResult } = require('express-validator');

// 2 - middleware ==> catch errore frome rules if exite
const validatorMiddleware = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: "fail",
      message: errors.array()[0].msg,
      errors: errors.array()[0]
    });
  }
  next();
}

module.exports = validatorMiddleware;