const express = require('express');
const router = express.Router();
const ProformaInvoice = require('../models/ProformaInvoice');

// POST: Save Proforma Invoice
router.post('/', async (req, res) => {
  try {
    const data = { ...req.body };

    if (!data.piNumber) {
      return res.status(400).json({ message: 'PI Number is required.' });
    }

    // 1. DROP BROKEN MONGODB INDEXES
    try {
      await ProformaInvoice.collection.dropIndexes();
    } catch (e) {
      // Ignore if no indexes exist
    }

    // 2. BULLETPROOF DUPLICATE CHECK
    const existingInvoice = await ProformaInvoice.findOne({
      $or: [
        { piNumber: data.piNumber },
        { proformaInvoiceNumber: data.piNumber }
      ]
    });

    if (existingInvoice) {
      return res.status(400).json({ 
        message: `Duplicate PI Number! Invoice "${data.piNumber}" already exists in the system.` 
      });
    }

    // 3. Clean empty ObjectId fields to prevent MongoDB CastErrors
    const objFields = ['primaryBuyer', 'loadingPort', 'dischargePort'];
    objFields.forEach(field => {
      if (!data[field] || data[field] === '') {
        delete data[field];
      }
    });

    // 4. Clean empty product ID references
    if (data.products && Array.isArray(data.products)) {
      data.products = data.products.map(p => {
        if (!p.productId || p.productId === '') delete p.productId;
        return p;
      });
    }

    // 5. Clean empty notify buyer ID references
    if (data.notifyBuyers && Array.isArray(data.notifyBuyers)) {
      data.notifyBuyers = data.notifyBuyers.map(n => {
        if (!n.buyerId || n.buyerId === '') delete n.buyerId;
        return n;
      });
    }

    // 6. Save the new Proforma Invoice
    const newProforma = new ProformaInvoice(data);
    const saved = await newProforma.save();
    
    res.status(201).json(saved);
  } catch (error) {
    console.error("Proforma Invoice Save Error:", error);
    res.status(500).json({ message: 'Error saving Proforma Invoice', error: error.message });
  }
});

// GET: Fetch all Proforma Invoices
router.get('/', async (req, res) => {
  try {
    const data = await ProformaInvoice.find()
      .populate('primaryBuyer') 
      .populate('loadingPort dischargePort')
      .sort({ createdAt: -1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching data', error: error.message });
  }
});

// DELETE: Remove Proforma Invoice
router.delete('/:id', async (req, res) => {
  try {
    const deletedPI = await ProformaInvoice.findByIdAndDelete(req.params.id);
    if (!deletedPI) {
      return res.status(404).json({ message: 'Proforma Invoice not found' });
    }
    res.json({ message: 'Proforma Invoice deleted successfully.' });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ message: 'Error deleting Proforma Invoice', error: error.message });
  }
});

module.exports = router;