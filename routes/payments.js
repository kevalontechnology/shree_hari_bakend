const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');

// GET all payments
router.get('/', async (req, res) => {
  try {
    const payments = await Payment.find().sort({ date: -1 });
    res.json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ message: 'Error fetching payments' });
  }
});

// POST new payment
router.post('/', async (req, res) => {
  try {
    const newPayment = await Payment.create(req.body);
    res.status(201).json(newPayment);
  } catch (error) {
    console.error("Error creating payment:", error);
    res.status(500).json({ message: 'Error creating payment', error: error.message });
  }
});

// DELETE payment
router.delete('/:id', async (req, res) => {
  try {
    await Payment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error("Error deleting payment:", error);
    res.status(500).json({ message: 'Error deleting payment' });
  }
});

module.exports = router;