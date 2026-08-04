const express = require('express');
const router = express.Router();
const ProformaInvoice = require('../models/ProformaInvoice');

// POST: Save Proforma Invoice
router.post('/', async (req, res) => {
  try {
    const newProforma = new ProformaInvoice(req.body);
    const saved = await newProforma.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: 'Error saving Proforma Invoice', error: error.message });
  }
});

// GET: Fetch all Proforma Invoices
router.get('/', async (req, res) => {
  try {
    const data = await ProformaInvoice.find()
      .populate('consignee')
      .populate('portOfLoading portOfDischarge')
      .sort({ createdAt: -1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching data', error: error.message });
  }
});

module.exports = router;