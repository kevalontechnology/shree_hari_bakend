const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Added Bank to the imports
const { Buyer, Manufacturer, Port, Exporter, Product, RangeData, Bank } = require('../models/ReferenceData');
const Notification = require('../models/Notification');

// AUTOMATICALLY CREATE UPLOADS FOLDER IF IT IS MISSING
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer Storage for Images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); 
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// ======================== EXPORTER (CRUD + SETTINGS) ========================
router.get('/exporters', async (req, res) => {
  try {
    const exporters = await Exporter.find();
    res.status(200).json(exporters);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching exporters' });
  }
});

router.get('/exporter', async (req, res) => {
  try {
    const exporter = await Exporter.findOne();
    res.status(200).json(exporter || {});
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

router.post('/exporter', upload.fields([
  { name: 'logoImage', maxCount: 1 }, 
  { name: 'footerImage', maxCount: 1 },
  { name: 'signatureImage', maxCount: 1 }
]), async (req, res) => {
  try {
    const exporterData = { ...req.body }; 
    if (req.files) {
      if (req.files['logoImage'] && req.files['logoImage'][0]) {
        exporterData.logoImage = `/uploads/${req.files['logoImage'][0].filename}`;
      }
      if (req.files['footerImage'] && req.files['footerImage'][0]) {
        exporterData.footerImage = `/uploads/${req.files['footerImage'][0].filename}`;
      }
      if (req.files['signatureImage'] && req.files['signatureImage'][0]) {
        exporterData.signatureImage = `/uploads/${req.files['signatureImage'][0].filename}`;
      }
    }
    const exporter = new Exporter(exporterData);
    await exporter.save();
    
    try {
      await Notification.create({
        title: 'New Exporter Added',
        message: `Exporter ${exporterData.companyName || 'New Company'} has been added to master data.`,
        type: 'master'
      });
    } catch (notifErr) { console.error('Failed to create notification:', notifErr); }
    
    res.status(201).json({ message: 'Exporter created successfully', exporter });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create exporter', error: error.message });
  }
});

const updateExporterHandler = async (req, res) => {
  try {
    const exporterData = { ...req.body }; 
    if (req.files) {
      if (req.files['logoImage'] && req.files['logoImage'][0]) {
        exporterData.logoImage = `/uploads/${req.files['logoImage'][0].filename}`;
      }
      if (req.files['footerImage'] && req.files['footerImage'][0]) {
        exporterData.footerImage = `/uploads/${req.files['footerImage'][0].filename}`;
      }
      if (req.files['signatureImage'] && req.files['signatureImage'][0]) {
        exporterData.signatureImage = `/uploads/${req.files['signatureImage'][0].filename}`;
      }
    }
    let exporter;
    if (req.params.id) {
      exporter = await Exporter.findByIdAndUpdate(req.params.id, exporterData, { new: true });
    } else {
      exporter = await Exporter.findOne();
      if (exporter) {
        exporter = await Exporter.findOneAndUpdate({}, exporterData, { new: true });
      } else {
        exporter = new Exporter(exporterData);
        await exporter.save();
      }
    }
    res.status(200).json({ message: 'Exporter updated successfully', exporter });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update exporter', error: error.message });
  }
};

router.put('/exporter/:id', upload.fields([
  { name: 'logoImage', maxCount: 1 }, 
  { name: 'footerImage', maxCount: 1 },
  { name: 'signatureImage', maxCount: 1 }
]), updateExporterHandler);

router.put('/exporter', upload.fields([
  { name: 'logoImage', maxCount: 1 }, 
  { name: 'footerImage', maxCount: 1 },
  { name: 'signatureImage', maxCount: 1 }
]), updateExporterHandler);

router.delete('/exporter/:id', async (req, res) => {
  try {
    const deletedExporter = await Exporter.findByIdAndDelete(req.params.id);
    if (!deletedExporter) return res.status(404).json({ message: 'Exporter not found' });
    
    try {
      await Notification.create({
        title: 'Exporter Deleted',
        message: `Exporter ${deletedExporter.companyName || 'Company'} has been removed from master data.`,
        type: 'master'
      });
    } catch (notifErr) { console.error('Failed to create notification:', notifErr); }
    
    res.json({ message: 'Exporter deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting exporter' });
  }
});

// ======================== BUYER CRUD ========================
router.post('/buyer', async (req, res) => {
  try {
    const newBuyer = await Buyer.create(req.body);
    try {
      await Notification.create({
        title: 'New Buyer Added',
        message: `Buyer ${req.body.name || 'New Buyer'} has been added to master data.`,
        type: 'master'
      });
    } catch (notifErr) { console.error('Failed to create notification:', notifErr); }
    res.status(201).json(newBuyer);
  } catch (error) {
    res.status(500).json({ message: 'Error adding buyer', error: error.message });
  }
});

router.get('/buyers', async (req, res) => {
  try {
    const buyers = await Buyer.find();
    res.json(buyers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching buyers' });
  }
});

router.put('/buyer/:id', async (req, res) => {
  try {
    const updatedBuyer = await Buyer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedBuyer);
  } catch (error) {
    res.status(500).json({ message: 'Error updating buyer' });
  }
});

router.delete('/buyer/:id', async (req, res) => {
  try {
    const buyer = await Buyer.findByIdAndDelete(req.params.id);
    if (buyer) {
      try {
        await Notification.create({
          title: 'Buyer Deleted',
          message: `Buyer ${buyer.name || 'Unknown'} was removed from master data.`,
          type: 'master'
        });
      } catch(e) {}
    }
    res.json({ message: 'Buyer deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting buyer' });
  }
});

// ======================== MANUFACTURER CRUD ========================
router.post('/manufacturer', async (req, res) => {
  try {
    const newManuf = await Manufacturer.create(req.body);
    try {
      await Notification.create({
        title: 'New Manufacturer Added',
        message: `Manufacturer ${req.body.companyName || 'New Manufacturer'} has been added to master data.`,
        type: 'master'
      });
    } catch (notifErr) { console.error('Failed to create notification:', notifErr); }
    res.status(201).json(newManuf);
  } catch (error) {
    res.status(500).json({ message: 'Error adding manufacturer', error: error.message });
  }
});

router.get('/manufacturers', async (req, res) => {
  try {
    const manufacturers = await Manufacturer.find();
    res.json(manufacturers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching manufacturers' });
  }
});

router.put('/manufacturer/:id', async (req, res) => {
  try {
    const updated = await Manufacturer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error updating manufacturer' });
  }
});

router.delete('/manufacturer/:id', async (req, res) => {
  try {
    const manuf = await Manufacturer.findByIdAndDelete(req.params.id);
    if (manuf) {
      try {
        await Notification.create({
          title: 'Manufacturer Deleted',
          message: `Manufacturer ${manuf.companyName || 'Unknown'} was removed from master data.`,
          type: 'master'
        });
      } catch(e) {}
    }
    res.json({ message: 'Manufacturer deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting manufacturer' });
  }
});

// ======================== PRODUCT CRUD (UPDATED WITH MULTER) ========================
router.post('/product', upload.single('productImage'), async (req, res) => {
  try {
    const productData = { ...req.body };
    if (req.file) {
      productData.productImage = `/uploads/${req.file.filename}`;
    }
    const newProduct = await Product.create(productData);
    try {
      await Notification.create({
        title: 'New Product Added',
        message: `Product ${req.body.productName || 'New Product'} has been added to master data.`,
        type: 'master'
      });
    } catch (e) {}
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

router.put('/product/:id', upload.single('productImage'), async (req, res) => {
  try {
    const productData = { ...req.body };
    if (req.file) {
      productData.productImage = `/uploads/${req.file.filename}`;
    }
    const updated = await Product.findByIdAndUpdate(req.params.id, productData, { new: true });
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

// ======================== PORT CRUD ========================
router.post('/port', async (req, res) => {
  try {
    const newPort = await Port.create(req.body);
    try {
      await Notification.create({
        title: 'New Port Added',
        message: `Port ${req.body.portName || 'New Port'} has been added to master data.`,
        type: 'master'
      });
    } catch (e) {}
    res.status(201).json(newPort);
  } catch (error) {
    res.status(500).json({ message: 'Error adding port', error: error.message });
  }
});

router.get('/ports', async (req, res) => {
  try {
    const ports = await Port.find();
    res.json(ports);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching ports' });
  }
});

router.put('/port/:id', async (req, res) => {
  try {
    const updated = await Port.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error updating port' });
  }
});

router.delete('/port/:id', async (req, res) => {
  try {
    const port = await Port.findByIdAndDelete(req.params.id);
    if (port) {
      try {
        await Notification.create({
          title: 'Port Deleted',
          message: `Port ${port.portName || 'Unknown'} was removed from master data.`,
          type: 'master'
        });
      } catch(e) {}
    }
    res.json({ message: 'Port deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting port' });
  }
});

// ======================== RANGE CRUD ========================
router.post('/range', async (req, res) => {
  try {
    const newRange = await RangeData.create(req.body);
    try {
      await Notification.create({
        title: 'New Range/Division Added',
        message: `Range ${req.body.name || 'New Range'} has been added to master data.`,
        type: 'master'
      });
    } catch(e) {}
    res.status(201).json(newRange);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/ranges', async (req, res) => {
  try {
    const ranges = await RangeData.find();
    res.json(ranges);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/range/:id', async (req, res) => {
  try {
    const updated = await RangeData.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/range/:id', async (req, res) => {
  try {
    const range = await RangeData.findByIdAndDelete(req.params.id);
    if (range) {
      try {
        await Notification.create({
          title: 'Range/Division Deleted',
          message: `Range ${range.name || 'Unknown'} was removed from master data.`,
          type: 'master'
        });
      } catch(e) {}
    }
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ======================== BANK CRUD (NEW) ========================
router.post('/bank', async (req, res) => {
  try {
    const newBank = await Bank.create(req.body);
    try {
      await Notification.create({
        title: 'New Bank Added',
        message: `Bank ${req.body.bankName || 'New Bank'} has been added to master data.`,
        type: 'master'
      });
    } catch(e) {}
    res.status(201).json(newBank);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/banks', async (req, res) => {
  try {
    const banks = await Bank.find();
    res.json(banks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/bank/:id', async (req, res) => {
  try {
    const updated = await Bank.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/bank/:id', async (req, res) => {
  try {
    const bank = await Bank.findByIdAndDelete(req.params.id);
    if (bank) {
      try {
        await Notification.create({
          title: 'Bank Deleted',
          message: `Bank ${bank.bankName || 'Unknown'} was removed from master data.`,
          type: 'master'
        });
      } catch(e) {}
    }
    res.json({ message: 'Bank deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;