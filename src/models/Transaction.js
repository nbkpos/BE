const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true },
  merchantId: { type: String, required: true },
  cardDetails: {
    cardNumber: { type: String, required: true, select: false }, // store masked/hashed in real life
    expiryDate: { type: String, required: true },
    cvv: { type: String, required: true, select: false },
    cardHolderName: { type: String, required: true }
  },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  protocol: { type: String, required: true },
  authCode: { type: String, required: true },
  mtiCode: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'declined', 'failed', 'completed'], default: 'pending' },
  approvalCode: { type: String },
  responseCode: { type: String },
  isOnline: { type: Boolean, default: true },
  payoutStatus: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
  payoutMethod: { type: String, enum: ['bank', 'crypto'] },
  payoutTxId: { type: String }
}, { timestamps: { createdAt: 'createdAt', updatedAt: 'processedAt' } });

module.exports = mongoose.model('Transaction', transactionSchema);
