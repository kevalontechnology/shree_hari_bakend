const mongoose = require('mongoose');

// --- BUYER MODEL ---
const buyerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true }, // NEW
  nitNumber: { type: String }, // NEW
  currency: { type: String, default: 'USD' }, // NEW
  guard: { type: String }, // NEW
  shipperAuthorizeName: { type: String }, // NEW
  shipperMan24x7: { type: String }, // NEW
  isShipperAuthorized: { type: Boolean, default: false },
  is24x7Contact: { type: Boolean, default: false }
}, { timestamps: true });

const Buyer = mongoose.model('Buyer', buyerSchema);

// --- MANUFACTURER MODEL ---
const manufacturerSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  address: { type: String, required: true }, // NEW
  permissionNumber: { type: String, required: true }, // NEW
  gstNo: { type: String } // NEW
}, { timestamps: true });

const Manufacturer = mongoose.model('Manufacturer', manufacturerSchema);


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
  ifscCode: String
});

const Exporter = mongoose.model('Exporter', exporterSchema);

// --- PORT MODEL ---
const portSchema = new mongoose.Schema({
  portName: { type: String, required: true },
  countryName: { type: String },
  type: { type: String, enum: ['Loading', 'Discharge', 'Gateway'], required: true }
}, { timestamps: true });

const Port = mongoose.model('Port', portSchema);

// --- PRODUCT MODEL ---

const productSchema = new mongoose.Schema({
  product_id: { type: String }, // 'required: true' yahan se hata dein
  productName: { type: String, required: true },
  hsnCode: { type: String },         
  category: { type: String },        
  unit: { type: String, default: 'Pcs' },
  netWeight: { type: Number },       
  grossWeight: { type: Number },     
  description: { type: String },     
  price: { type: Number },           
  exchangeRate: { type: Number }     
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

// const productSchema = new mongoose.Schema({
//   productName: { type: String, required: true },
//   productType: { type: String },
//   unit: { type: String, default: 'Pcs' },
//   price: { type: Number },
//   exchangeRate: { type: Number }
// }, { timestamps: true });
// const Product = mongoose.model('Product', productSchema);


// --- RANGE MODEL (UPDATED) ---
const rangeSchema = new mongoose.Schema({
  range: { type: String, required: true },
  rangeCode: { type: String },
  division: { type: String, required: true },
  divisionCode: { type: String },
  commissionerate: { type: String, required: true },
  commissionerateCode: { type: String }
}, { timestamps: true });

const RangeData = mongoose.model('RangeData', rangeSchema);

module.exports = { Buyer, Manufacturer, Port, Exporter, Product, RangeData };
