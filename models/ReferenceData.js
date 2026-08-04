const mongoose = require('mongoose');

// --- BUYER MODEL ---
const buyerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  nitNumber: { type: String },
  currency: { type: String, default: 'USD' },
  guard: { type: String },
  shipperAuthorizeName: { type: String },
  shipperMan24x7: { type: String },
  isShipperAuthorized: { type: Boolean, default: false },
  is24x7Contact: { type: Boolean, default: false }
}, { timestamps: true });

const Buyer = mongoose.model('Buyer', buyerSchema);

// --- MANUFACTURER MODEL ---
const manufacturerSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  address: { type: String, required: true },
  permissionNumber: { type: String, required: true },
  gstNo: { type: String }
}, { timestamps: true });

const Manufacturer = mongoose.model('Manufacturer', manufacturerSchema);

// --- EXPORTER MODEL (UPDATED) ---
const exporterSchema = new mongoose.Schema({
  companyName: String,
  companyAddress: String,
  email: String,
  website: String,
  iecNo: String,
  gstNo: String,
  lutNo: String,
  registeredAddress: String,
  logoImage: { type: String },     
  footerImage: { type: String },
  signatureImage: { type: String },
  bankName: String,
  accountHolderName: String,
  accountNumber: String,
  ifscCode: String,
  // NEW FIELDS ADDED BELOW
  consignee: String,
  binNo: String,
  officeNumber: String
});

const Exporter = mongoose.model('Exporter', exporterSchema);

// --- PORT MODEL ---
const portSchema = new mongoose.Schema({
  portName: { type: String, required: true },
  countryName: { type: String },
  type: { type: String, enum: ['Loading', 'Discharge', 'Gateway'], required: true }
}, { timestamps: true });

const Port = mongoose.model('Port', portSchema);

// --- PRODUCT MODEL (UPDATED) ---
const productSchema = new mongoose.Schema({
  product_id: { type: String },
  productName: { type: String, required: true },
  hsnCode: { type: String },           
  category: { type: String },          
  unit: { type: String, default: 'Pcs' },
  netWeight: { type: Number },         
  grossWeight: { type: Number },       
  description: { type: String },       
  price: { type: Number },             
  exchangeRate: { type: Number },
  // NEW FIELDS ADDED BELOW
  igst: { type: Number },
  cgst: { type: Number },
  sgst: { type: Number },
  productImage: { type: String } 
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

// --- RANGE MODEL ---
const rangeSchema = new mongoose.Schema({
  range: { type: String, required: true },
  rangeCode: { type: String },
  division: { type: String, required: true },
  divisionCode: { type: String },
  commissionerate: { type: String, required: true },
  commissionerateCode: { type: String }
}, { timestamps: true });

const RangeData = mongoose.model('RangeData', rangeSchema);

// --- BANK MODEL (NEW) ---
const bankSchema = new mongoose.Schema({
  bankName: { type: String, required: true },
  branchAddress: { type: String, required: true },
  accountName: { type: String, required: true },
  accountNumber: { type: String, required: true },
  swiftCode: { type: String, required: true }
}, { timestamps: true });

const Bank = mongoose.model('Bank', bankSchema);

module.exports = { Buyer, Manufacturer, Port, Exporter, Product, RangeData, Bank };