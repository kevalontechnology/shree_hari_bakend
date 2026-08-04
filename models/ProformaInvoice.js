const mongoose = require('mongoose');

const proformaInvoiceSchema = new mongoose.Schema({
  proformaInvoiceNumber: { type: String, required: true, unique: true },
  proformaDate: { type: Date, required: true },
  exporterRef: { type: String },
  buyerRefAndDate: { type: String },
  consignee: { type: mongoose.Schema.Types.ObjectId, ref: 'Buyer' },
  notifyParty: { type: String },
  portOfLoading: { type: mongoose.Schema.Types.ObjectId, ref: 'Port' },
  countryOfOrigin: { type: String, default: 'India' },
  portOfDischarge: { type: mongoose.Schema.Types.ObjectId, ref: 'Port' },
  finalDestination: { type: String },
  countryOfDestination: { type: String },
  preCarriageBy: { type: String, enum: ['Road', 'Sea', 'Air'] },
  preCarriageReceipt: { type: String },
  vesselNo: { type: String },
  incoterm: { type: String, enum: ['FOB', 'CIF', 'CIP', 'DDP', 'DDU'] },
  deliveryAndPaymentTerms: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('ProformaInvoice', proformaInvoiceSchema);