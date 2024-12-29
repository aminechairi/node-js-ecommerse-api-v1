// @des This class is responsible aboute operational errore ( errore that is can preidct )
class ApiErrore extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith(4) ? `fail` : `error`;
    this.isOperational = true;
  }
};

module.exports = ApiErrore;