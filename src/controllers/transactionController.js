const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const Transaction = require('../models/Transaction');
const mtiProcessor = require('../services/mtiProcessor');

const processSchema = Joi.object({
  cardHolderName: Joi.string().required(),
  cardNumber: Joi.string().pattern(/^[\d\s]{13,19}$/).required(),
  expiryDate: Joi.string().pattern(/^(0[1-9]|1[0-2])\/\d{2}$/).required(),
  cvv: Joi.string().pattern(/^\d{3,4}$/).required(),
  amount: Joi.number().positive().required(),
  currency: Joi.string().default('USD'),
  protocol: Joi.string().required(),
  authCode: Joi.string().required(),
  isOnline: Joi.boolean().default(true),
  payoutMethod: Joi.string().valid('bank', 'crypto').optional()
});

exports.process = async (req, res) => {
  const { error, value } = processSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, error: error.details[0].message });

  const data = {
    transactionId: uuidv4(),
    merchantId: req.user.merchantId,
    cardDetails: {
      cardNumber: value.cardNumber.replace(/\s/g, ''),
      expiryDate: value.expiryDate,
      cvv: value.cvv,
      cardHolderName: value.cardHolderName
    },
    amount: value.amount,
    currency: value.currency,
    protocol: value.protocol,
    authCode: value.authCode,
    mtiCode: '0100',
    isOnline: value.isOnline,
    payoutMethod: value.payoutMethod
  };

  const tx = await mtiProcessor.processTransaction(data);

  res.json({ success: true, transactionId: tx.transactionId, status: tx.status });
};

exports.history = async (req, res) => {
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 100);
  const q = { merchantId: req.user.merchantId };
  const [items, total] = await Promise.all([
    Transaction.find(q).sort({ createdAt: -1 }).limit(limit).skip((page - 1) * limit).select('+cardDetails.cardNumber'),
    Transaction.countDocuments(q)
  ]);
  res.json({ success: true, transactions: items.map(i => ({ 
    transactionId: i.transactionId,
    amount: i.amount,
    currency: i.currency,
    status: i.status,
    payoutStatus: i.payoutStatus,
    createdAt: i.createdAt
  })), totalPages: Math.ceil(total / limit), currentPage: page });
};

exports.getOne = async (req, res) => {
  const tx = await Transaction.findOne({ transactionId: req.params.transactionId, merchantId: req.user.merchantId }).select('+cardDetails.cardNumber');
  if (!tx) return res.status(404).json({ success: false, error: 'Transaction not found' });
  // redact card number except last 4
  const card = tx.cardDetails;
  const masked = card.cardNumber ? ('**** **** **** ' + card.cardNumber.slice(-4)) : undefined;
  const out = tx.toObject();
  out.cardDetails.cardNumber = masked;
  if (out.cardDetails.cvv) delete out.cardDetails.cvv;
  res.json({ success: true, transaction: out });
};
