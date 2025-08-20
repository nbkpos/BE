const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');
const mtiProcessor = require('./mtiProcessor');

module.exports = (io) => {
  mtiProcessor.initialize(io);

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error('Authentication error'));
      socket.userId = user._id.toString();
      socket.merchantId = user.merchantId;
      next();
    } catch (e) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: merchant ${socket.merchantId}`);
    socket.join(`merchant_${socket.merchantId}`);

    socket.on('disconnect', () => logger.info(`Socket disconnected: merchant ${socket.merchantId}`));
  });
};
