const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const { issueToken } = require('../services/tokenService');

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  businessName: Joi.string().min(2).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

exports.register = async (req, res) => {
  const { error, value } = registerSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, error: error.details[0].message });

  const exists = await User.findOne({ email: value.email });
  if (exists) return res.status(409).json({ success: false, error: 'Email already in use' });

  const user = await User.create({
    merchantId: uuidv4(),
    email: value.email,
    password: value.password,
    businessName: value.businessName,
    payoutSettings: {
      bankAccount: {},
      cryptoWallet: {},
      defaultPayoutMethod: 'bank'
    }
  });

  const token = issueToken(user._id);
  res.status(201).json({ success: true, token, user: { id: user._id, merchantId: user.merchantId, email: user.email, businessName: user.businessName } });
};

exports.login = async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, error: error.details[0].message });

  const user = await User.findOne({ email: value.email });
  if (!user) return res.status(401).json({ success: false, error: 'Invalid credentials' });

  const ok = await user.comparePassword(value.password);
  if (!ok) return res.status(401).json({ success: false, error: 'Invalid credentials' });

  const token = issueToken(user._id);
  res.json({ success: true, token, user: { id: user._id, merchantId: user.merchantId, email: user.email, businessName: user.businessName } });
};

exports.me = async (req, res) => {
  const u = req.user;
  res.json({ success: true, user: { id: u._id, merchantId: u.merchantId, email: u.email, businessName: u.businessName, payoutSettings: u.payoutSettings } });
};
