const jwt = require('jsonwebtoken');

exports.issueToken = (userId) => {
  const secret = process.env.JWT_SECRET || 'fallback_secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '1d';
  return jwt.sign({ id: userId }, secret, { expiresIn });
};
