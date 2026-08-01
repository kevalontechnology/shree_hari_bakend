const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
status: { 
  type: String, 
  enum: ['Pending', 'Ongoing', 'Complied'], // Must match frontend dropdown values exactly
  default: 'Pending' 
},
  
  // SECTION 2: Invoice Details
  invoiceNumber: { type: String, required: true, unique: true },
  invoiceDate: { type: Date, default: Date.now },
  countryOfOrigin: { type: String, default: 'INDIA' },
  currency: { type: String, enum: ['INR', 'USD', 'EUR'], default: 'USD' },
  paymentTerms: { type: String, default: '120 DAYS AGAINST BL' },
  exportTerms: { type: String, default: 'FOB' },

  // SECTION 2.5: Exporter Details captured from Master Form
  exporterDetails: {
    companyName: { type: String },
    companyAddress: { type: String },
    officeAddress: { type: String },
    officeNumber: { type: String },
    website: { type: String },
    consignee: { type: String },
    iecNo: { type: String },
    gstNo: { type: String },
    binNo: { type: String },
    lutNo: { type: String }
  },

  // SECTION 3: Parties (References to ReferenceData models)
  primaryBuyer: { type: mongoose.Schema.Types.ObjectId, ref: 'Buyer' },
  buyerDetails: {
    address: { type: String },
    nitNumber: { type: String },
    currency: { type: String },
    guard: { type: String },
    shipperAuthorizeName: { type: String },
    shipperMan24x7: { type: String }
  },
  notifyParties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Buyer' }],
  rangeDataId: { type: mongoose.Schema.Types.ObjectId, ref: 'RangeData' },

  // SECTION 4: Manufacturer
  manufacturer: { type: mongoose.Schema.Types.ObjectId, ref: 'Manufacturer' },
  manufacturerDetails: {
    address: { type: String },
    permissionNumber: { type: String },
    gstNo: { type: String }
  },

  // SECTION 5: Ports
  loadingPort: { type: mongoose.Schema.Types.ObjectId, ref: 'Port' },
  dischargePort: { type: mongoose.Schema.Types.ObjectId, ref: 'Port' },
  gatewayPort: { type: mongoose.Schema.Types.ObjectId, ref: 'Port' },

  // SECTION 6: Containers
  containers: [{
    containerNumber: { type: String },
    lineSealNumber: { type: String },
    electronicSealNumber: { type: String },
    type: { type: String }, // e.g., "40' High Cube", "20' Dry"
    quantity: { type: Number, default: 1 }, 
    containerQuantity: { type: String },
    maxWeightKG: { type: Number },
    punchSeal: { type: String, enum: ['Cargo', 'Non-Cargo'] }
  }],

  // SECTION 7: Products
  products: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productType: String,
    productName: String,
    quantityUnit: String,
    quantity: Number,
    packagesCount: Number,
    pricePerUnit: Number, // NEWLY ADDED
    exchangeRate: Number, // NEWLY ADDED
    netWeightKG: Number,
    grossWeightKG: Number
  }],

  // SECTION 8: Insurance
  insurance: {
    percentage: { type: Number },
    amount: { type: Number },
    company: { type: String },
    policyNumber: { type: String }
  }
}, { timestamps: true });

// Auto-calculate total price for products before saving to the database
// Auto-calculate total price for products before saving to the database
// We removed 'next' to comply with modern Mongoose standards
shipmentSchema.pre('save', function() {
  if (this.products && this.products.length > 0) {
    this.products.forEach(product => {
      // Added fallback values (|| 0) to prevent NaN math errors
      product.totalPrice = (product.quantity || 0) * (product.pricePerUnit || 0);
    });
  }
});

module.exports = mongoose.model('Shipment', shipmentSchema);