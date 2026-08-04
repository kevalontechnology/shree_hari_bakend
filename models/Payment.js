const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  proformaInvoiceNumber: { type: String, required: true },
  buyerName: { type: String, required: true },
  paymentFromCustomer: { type: Number, required: true },
  actualPaymentReceived: { type: Number, required: true },
  bank: { type: String },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);