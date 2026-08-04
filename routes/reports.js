const express = require('express');
const router = express.Router();
const Shipment = require('../models/Shipment');
const Payment = require('../models/Payment');

// GET: Item-Wise Report (Aggregates products from Shipments)
router.get('/item-wise', async (req, res) => {
  try {
    const reportData = await Shipment.aggregate([
      { $unwind: { path: "$products", preserveNullAndEmptyArrays: false } },
      {
        $lookup: {
          from: "buyers",
          localField: "primaryBuyer",
          foreignField: "_id",
          as: "buyerData"
        }
      },
      { $unwind: { path: "$buyerData", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          invNo: { $ifNull: ["$invoiceNumber", "N/A"] },
          // BUG FIX: Safely converts string dates to proper dates, handles nulls
          invDate: { 
            $dateToString: { 
              format: "%Y-%m-%d", 
              date: { $toDate: "$invoiceDate" },
              onNull: "N/A" 
            } 
          },
          consigneeName: { $ifNull: ["$buyerData.name", "Unknown"] },
          countryOfOrigin: { $ifNull: ["$countryOfOrigin", "INDIA"] },
          productName: { $ifNull: ["$products.productName", "Unknown Item"] },
          quantity: { $ifNull: ["$products.quantity", 0] },
          unit: { $ifNull: ["$products.quantityUnit", "Pcs"] }
        }
      },
      { $sort: { invDate: -1 } }
    ]);
    res.json(reportData);
  } catch (error) {
    console.error("Error generating Item-Wise Report:", error);
    res.status(500).json({ message: "Error generating report", error: error.message });
  }
});

// GET: Party-Wise Report (Combines Shipments as Debit and Payments as Credit)
router.get('/party-wise', async (req, res) => {
  try {
    // 1. Get all shipments (Debits)
    const shipments = await Shipment.aggregate([
      { $unwind: { path: "$products", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$_id",
          invDate: { $first: "$invoiceDate" },
          invoiceNumber: { $first: "$invoiceNumber" },
          buyerId: { $first: "$primaryBuyer" },
          totalValue: { $sum: { $multiply: [{ $ifNull: ["$products.quantity", 0] }, { $ifNull: ["$products.pricePerUnit", 0] }] } }
        }
      },
      {
        $lookup: {
          from: "buyers",
          localField: "buyerId",
          foreignField: "_id",
          as: "buyer"
        }
      },
      { $unwind: { path: "$buyer", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          // BUG FIX: Safely converts string dates to proper dates, handles nulls
          invDate: { 
            $dateToString: { 
              format: "%Y-%m-%d", 
              date: { $toDate: "$invDate" },
              onNull: "N/A" 
            } 
          },
          particulars: { $concat: ["Invoice No: ", { $ifNull: ["$invoiceNumber", ""] }, " (", { $ifNull: ["$buyer.name", "Unknown"] }, ")"] },
          debit: "$totalValue",
          credit: { $literal: 0 },
          rawDate: { $toDate: "$invDate" } // Used for sorting later
        }
      }
    ]);

    // 2. Get all Payments (Credits)
    const payments = await Payment.aggregate([
      {
        $project: {
          // BUG FIX: Safely converts string dates to proper dates, handles nulls
          invDate: { 
            $dateToString: { 
              format: "%Y-%m-%d", 
              date: { $toDate: "$date" },
              onNull: "N/A"
            } 
          },
          particulars: { $concat: ["Payment Received - ", { $ifNull: ["$bank", ""] }, " (", { $ifNull: ["$buyerName", "Unknown"] }, ")"] },
          debit: { $literal: 0 },
          credit: { $ifNull: ["$actualPaymentReceived", 0] },
          rawDate: { $toDate: "$date" } // Used for sorting later
        }
      }
    ]);

    // Combine and sort by date safely
    const combinedLedger = [...shipments, ...payments].sort((a, b) => {
      const dateA = a.rawDate ? new Date(a.rawDate) : new Date(0);
      const dateB = b.rawDate ? new Date(b.rawDate) : new Date(0);
      return dateB - dateA; // Newest first
    });
    
    res.json(combinedLedger);
  } catch (error) {
    console.error("Error generating Party-Wise Report:", error);
    res.status(500).json({ message: "Error generating report", error: error.message });
  }
});

module.exports = router;