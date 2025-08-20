const Transaction = require('../models/Transaction');

exports.status = async (req, res) => {
  const tx = await Transaction.findOne({ transactionId: req.params.id, merchantId: req.user.merchantId });
  if (!tx) return res.status(404).json({ success: false, error: 'Transaction not found' });
  res.json({ success: true, payoutStatus: tx.payoutStatus, payoutMethod: tx.payoutMethod, payoutTxId: tx.payoutTxId });
};
