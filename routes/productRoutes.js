const express = require('express');
const router = express.Router();
const { Product } = require('../models/ReferenceData');
const Notification = require('../models/Notification');

// ======================== PRODUCT CRUD ========================
router.post('/product', async (req, res) => {
  try {
    const newProduct = await Product.create(req.body);
    
    try {
      await Notification.create({
        title: 'New Product Added',
        message: `Product ${req.body.productName || 'New Product'} has been added to master data.`,
        type: 'master'
      });
    } catch (notifErr) { console.error('Failed to create notification:', notifErr); }

    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ message: 'Error adding product', error: error.message });
  }
});

router.get('/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products' });
  }
});

router.put('/product/:id', async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error updating product' });
  }
});

router.delete('/product/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (product) {
      try {
        await Notification.create({
          title: 'Product Deleted',
          message: `Product ${product.productName || 'Unknown'} was removed from master data.`,
          type: 'master'
        });
      } catch(e) {}
    }
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product' });
  }
});

module.exports = router;