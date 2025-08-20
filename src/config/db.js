const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/payment_terminal';
  try {
    await mongoose.connect(uri);
    logger.info('MongoDB connected');
  } catch (err) {
    logger.error('MongoDB connection error', { err });
    process.exit(1);
  }
};

module.exports = { connectDB };
