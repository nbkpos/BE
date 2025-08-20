const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  merchantId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  businessName: { type: String, required: true },
  payoutSettings: {
    bankAccount: {
      accountNumber: String,
      routingNumber: String,
      accountHolderName: String,
      bankName: String
    },
    cryptoWallet: {
      btcAddress: String,
      ethAddress: String,
      usdtAddress: String
    },
    defaultPayoutMethod: { type: String, enum: ['bank', 'crypto'], default: 'bank' }
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
