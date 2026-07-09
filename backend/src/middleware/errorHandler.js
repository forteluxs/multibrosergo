const { AppError, ValidationError } = require('../errors');

function errorHandler(err, req, res, _next) {
  if (err instanceof ValidationError) {
    return res.status(422).json({ error: err.message });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  console.error('[Unhandled Error]', err.stack || err.message || err);

  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Something broke!',
  });
}

module.exports = errorHandler;
