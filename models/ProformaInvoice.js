const mongoose = require('mongoose');

const proformaInvoiceSchema = new mongoose.Schema({
  // Invoice Information (Removed unique: true)
  piNumber: { type: String, required: true },
  piDate: { type: Date, required: true },
  exporterRef: { type: String },
  buyerRefNo: { type: String },
  buyerRefDate: { type: Date },
  validityDays: { type: String },
  paymentTerms: { type: String },
  exportTerms: { type: String },
  currency: { type: String, default: 'USD' },

  // Buyer & Notify Parties
  primaryBuyer: { type: mongoose.Schema.Types.ObjectId, ref: 'Buyer' },
  notifyBuyers: [{
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Buyer' },
    address: { type: String },
    nitNumber: { type: String }
  }],

  // Pre-Carriage Details
  preCarriageBy: { type: String },
  placeOfReceipt: { type: String },

  // Port & Logistics Details
  vesselNo: { type: String },
  imoNumber: { type: String },
  countryOfOrigin: { type: String, default: 'INDIA' },
  countryOfDestination: { type: String },
  loadingPort: { type: mongoose.Schema.Types.ObjectId, ref: 'Port' },
  dischargePort: { type: mongoose.Schema.Types.ObjectId, ref: 'Port' },
  finalDestination: { type: String },

  // Products Array
  products: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: { type: String },
    productType: { type: String },
    quantity: { type: Number },
    quantityUnit: { type: String },
    pricePerUnit: { type: Number },
    totalAmount: { type: Number }
  }],

  // Remarks & Extra Details
  notes: { type: String },
  buyerDetails: {
    address: { type: String },
    nitNumber: { type: String },
    currency: { type: String }
  },
  exporterDetails: {
    companyName: { type: String },
    companyAddress: { type: String },
    gstNo: { type: String },
    iecNo: { type: String }
  }
}, { timestamps: true });

module.exports = mongoose.model('ProformaInvoice', proformaInvoiceSchema);