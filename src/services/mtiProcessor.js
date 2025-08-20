const Transaction = require('../models/Transaction');
const payoutService = require('./payoutService');

const PROTOCOLS = {
  "POS Terminal -101.1 (4-digit approval)": 4,
  "POS Terminal -101.4 (6-digit approval)": 6,
  "POS Terminal -101.6 (Pre-authorization)": 6,
  "POS Terminal -101.7 (4-digit approval)": 4,
  "POS Terminal -101.8 (PIN-LESS transaction)": 4,
  "POS Terminal -201.1 (6-digit approval)": 6,
  "POS Terminal -201.3 (6-digit approval)": 6,
  "POS Terminal -201.5 (6-digit approval)": 6
};

class MTIProcessor {
  constructor() { this.io = null; }

  initialize(io) { this.io = io; }

  async processTransaction(data) {
    const tx = await Transaction.create(data);
    await this.processMTI0100(tx);
    return tx;
  }

  emit(merchantId, payload) {
    if (this.io) {
      this.io.to(`merchant_${merchantId}`).emit('mti_notification', { ...payload, timestamp: new Date().toISOString() });
    }
  }

  async processMTI0100(tx) {
    this.emit(tx.merchantId, { mti: '0100', transactionId: tx.transactionId, status: 'processing', message: 'Authorization request initiated' });
    const auth = await this.validate(tx);
    await this.processMTI0110(tx, auth);
  }

  async processMTI0110(tx, auth) {
    tx.status = auth.approved ? 'approved' : 'declined';
    tx.approvalCode = auth.approvalCode;
    tx.responseCode = auth.responseCode;
    await tx.save();

    this.emit(tx.merchantId, { mti: '0110', transactionId: tx.transactionId, status: tx.status, approvalCode: tx.approvalCode, responseCode: tx.responseCode, message: `Authorization ${tx.status}` });

    if (auth.approved) await this.processMTI0200(tx);
  }

  async processMTI0200(tx) {
    this.emit(tx.merchantId, { mti: '0200', transactionId: tx.transactionId, status: 'processing', message: 'Financial transaction processing' });
    await new Promise(r => setTimeout(r, 1200));
    const success = Math.random() > 0.05;
    await this.processMTI0210(tx, { success });
  }

  async processMTI0210(tx, result) {
    this.emit(tx.merchantId, { mti: '0210', transactionId: tx.transactionId, status: result.success ? 'completed' : 'failed', message: `Financial transaction ${result.success ? 'completed' : 'failed'}` });
    if (result.success) await this.initiatePayout(tx);
  }

  async initiatePayout(tx) {
    try {
      const method = tx.payoutMethod || 'bank';
      const payoutResult = method === 'bank' ? await payoutService.processBankPayout(tx, {}) : await payoutService.processCryptoPayout(tx, {});
      tx.payoutStatus = 'processing';
      tx.payoutMethod = payoutResult.method;
      tx.payoutTxId = payoutResult.txId;
      await tx.save();
      this.emit(tx.merchantId, { mti: 'PAYOUT', transactionId: tx.transactionId, status: 'payout_initiated', payoutMethod: payoutResult.method, message: 'Payout initiated' });
    } catch (e) {
      tx.payoutStatus = 'failed';
      await tx.save();
      this.emit(tx.merchantId, { mti: 'PAYOUT', transactionId: tx.transactionId, status: 'failed', message: 'Payout initiation failed' });
    }
  }

  validateCardNumber(num) {
    const clean = (num || '').replace(/\s/g, '');
    let sum = 0, dbl = false;
    for (let i = clean.length - 1; i >= 0; i--) {
      let d = parseInt(clean[i], 10);
      if (dbl) { d *= 2; if (d > 9) d -= 9; }
      sum += d; dbl = !dbl;
    }
    return sum % 10 === 0;
  }

  validateAuthCode(code, protocol) {
    const len = PROTOCOLS[protocol];
    return code && /^\d+$/.test(code) && code.length === len;
  }

  generateApprovalCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  async validate(tx) {
    const okCard = this.validateCardNumber(tx.cardDetails.cardNumber);
    const okAuth = this.validateAuthCode(tx.authCode, tx.protocol);
    if (okCard && okAuth) return { approved: true, approvalCode: this.generateApprovalCode(), responseCode: '00' };
    return { approved: false, approvalCode: null, responseCode: '05' };
  }
}

module.exports = new MTIProcessor();
