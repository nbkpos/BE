const logger = require('../utils/logger');

module.exports = (err, _req, res, _next) => {
  logger.error('Unhandled error', { err: err.stack || err.message || err });
  const status = err.status || 500;
  res.status(status).json({ success: false, error: err.message || 'Internal Server Error' });
};
