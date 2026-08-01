const express = require('express');
const router = express.Router();
const Shipment = require('../models/Shipment');
const Notification = require('../models/Notification');
const { Buyer, Manufacturer, Port, Product, RangeData } = require('../models/ReferenceData');

// @route   GET /api/shipments/dashboard-stats
// @desc    Get statistics for the admin dashboard
router.get('/dashboard-stats', async (req, res) => {
  try {
    // Count totals from your database
    const totalShipments = await Shipment.countDocuments();
    const totalBuyers = await Buyer.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalManufacturers = await Manufacturer.countDocuments();

    // NEW: Fetch the 5 most recent shipments for the dashboard table
    const recentShipments = await Shipment.find()
      .populate('primaryBuyer')
      .populate('dischargePort')
      .sort({ createdAt: -1 }) // Sort by newest first
      .limit(5); // Only grab the top 5
    
    res.json({
      pendingOrders: 0, // Update this if you have a status field
      runningShipments: totalShipments, 
      totalBuyers,
      totalProducts,
      totalManufacturers,
      recentShipments // <-- Now we are safely sending the array to React!
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error.message);
    res.status(500).json({ message: 'Error fetching dashboard stats' });
  }
});

router.get('/reference-data', async (req, res) => {
  try {
    const [buyers, manufacturers, ports, products, ranges] = await Promise.all([
      Buyer.find(),
      Manufacturer.find(),
      Port.find(),
      Product.find(),
      RangeData.find() // FETCH THIS!
    ]);
    res.json({ buyers, manufacturers, ports, products, ranges });
  } catch (error) {
    console.error("Error fetching reference data:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/shipments
// @desc    Get all shipments with populated reference data
router.get('/', async (req, res) => {
  try {
    const shipments = await Shipment.find()
      .populate('primaryBuyer') // <-- Ensures buyer document is loaded
      .populate('loadingPort dischargePort')
      .populate('rangeDataId')
      .sort({ createdAt: -1 });
      
    res.json(shipments);
  } catch (error) {
    console.error("Error fetching shipments:", error.message);
    res.status(500).json({ message: 'Error fetching shipments' });
  }
});

// @route   GET /api/shipments/:id
// @desc    Get a single shipment with populated reference data
router.get('/:id', async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id)
      .populate('primaryBuyer')
      .populate('notifyParties')
      .populate('loadingPort dischargePort gatewayPort')
      .populate('manufacturer')
      .populate('rangeDataId');
      
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }
    res.json(shipment);
  } catch (error) {
    console.error("Error fetching shipment:", error.message);
    res.status(500).json({ message: 'Error fetching shipment' });
  }
});

// @route   POST /api/shipments
// @desc    Create a new shipment
// @route   POST /api/shipments
// @desc    Create a new shipment
router.post('/', async (req, res) => {
  try {
    const data = { ...req.body };

    // 1. Clear empty ObjectId fields to prevent Mongoose CastError
    const singleRefFields = ['primaryBuyer', 'manufacturer', 'loadingPort', 'dischargePort', 'gatewayPort', 'rangeDataId'];
    singleRefFields.forEach(field => {
      if (!data[field] || data[field] === '' || data[field] === 'ADD_NEW') {
        delete data[field];
      }
    });

    // 2. Clean notifyParties array
    if (data.notifyParties && Array.isArray(data.notifyParties)) {
      data.notifyParties = data.notifyParties.filter(id => id && id.length > 5 && id !== 'ADD_NEW');
    }

    // 3. Clean product productId reference
    if (data.products && Array.isArray(data.products)) {
      data.products = data.products.map(p => {
        if (!p.productId || p.productId === '' || p.productId === 'ADD_NEW') {
          const { productId, ...restProduct } = p;
          return restProduct;
        }
        return p;
      });
    }

    // 4. Create Shipment
    const newShipment = await Shipment.create(data);
    
    try {
      await Notification.create({
        title: 'New Shipment Created',
        message: `Shipment ${data.invoiceNumber || 'New'} has been created.`,
        type: 'shipment'
      });
    } catch (notifErr) { 
      console.error('Failed to create notification:', notifErr); 
    }

    res.status(201).json(newShipment);
  } catch (error) {
    console.error("Error creating shipment:", error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Duplicate Invoice Number. This invoice already exists.' });
    }
    res.status(500).json({ message: 'Error saving shipment', error: error.message });
  }
});

// @route   DELETE /api/shipments/:id
// @desc    Delete a shipment
router.delete('/:id', async (req, res) => {
  try {
    await Shipment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Shipment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting shipment' });
  }
});

// @route   PATCH /api/shipments/:id/status
// @desc    Update shipment status
// PATCH update shipment status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    const updatedShipment = await Shipment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedShipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    res.json(updatedShipment);
  } catch (error) {
    console.error("Server error updating shipment status:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;