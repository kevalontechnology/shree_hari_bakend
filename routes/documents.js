const express = require('express');
const router = express.Router();
const Shipment = require('../models/Shipment');
const { Exporter } = require('../models/ReferenceData');
const { 
  generateInvoicePDF, 
  generatePackagingListPDF, 
  generateVGMPDF, 
  generateQuotationPDF, 
  generateAnnexurePDF 
} = require('../utils/pdfGenerator');
const { generateInrInvoicePdf } = require('../services/pdfService');

// 1. INVOICE ROUTE
router.get('/invoice/:shipmentId', async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.shipmentId)
      .populate('primaryBuyer')
      .populate('notifyParties')
      .populate('manufacturer')
      .populate('loadingPort dischargePort gatewayPort');

    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });

    const exporter = (await Exporter.findOne()) || {};
    const pdfBuffer = await generateInrInvoicePdf({
      ...(shipment ? shipment.toObject() : {}),
      exporter
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=INR-Invoice-${shipment.invoiceNumber || 'Download'}.pdf`,
    });
    res.send(pdfBuffer);
  } catch (error) {
    console.error("🔥 PDF Generation Error (Invoice):", error);
    res.status(500).json({ message: 'Error generating Invoice', error: error.message });
  }
});

// 2. PACKAGING LIST ROUTE
router.get('/packing-list/:shipmentId', async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.shipmentId)
      .populate('primaryBuyer')
      .populate('loadingPort dischargePort');

    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });

    const exporter = (await Exporter.findOne()) || {};
    const pdfBuffer = await generatePackagingListPDF(shipment, exporter);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=PackagingList-${shipment.invoiceNumber || 'Download'}.pdf`,
    });
    res.send(pdfBuffer);
  } catch (error) {
    console.error("🔥 PDF Generation Error (Pkg List):", error);
    res.status(500).json({ message: 'Error generating Packaging List' });
  }
});

// 3. VGM ROUTE
router.get('/vgm/:shipmentId', async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.shipmentId);
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });
    
    const exporter = (await Exporter.findOne()) || {};
    const pdfBuffer = await generateVGMPDF(shipment, exporter);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=VGM-${shipment.invoiceNumber || 'Download'}.pdf`,
    });
    res.send(pdfBuffer);
  } catch (error) {
    console.error("🔥 PDF Generation Error (VGM):", error);
    res.status(500).json({ message: 'Error generating VGM' });
  }
});

// 4. QUOTATION ROUTE
router.get('/quotation/:shipmentId', async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.shipmentId).populate('primaryBuyer');
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });
    
    const pdfBuffer = await generateQuotationPDF(shipment);
    
    res.set({ 
      'Content-Type': 'application/pdf', 
      'Content-Disposition': `attachment; filename=Quotation-${shipment.invoiceNumber || 'Download'}.pdf` 
    });
    res.send(pdfBuffer);
  } catch (error) {
    console.error("🔥 PDF Generation Error (Quotation):", error);
    res.status(500).json({ message: 'Error generating Quotation' });
  }
});

// 5. ANNEXURE ROUTE
router.get('/annexure/:shipmentId', async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.shipmentId)
      .populate('manufacturer')
      .populate('loadingPort dischargePort');
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });
    
    const exporter = (await Exporter.findOne()) || {};
    const pdfBuffer = await generateAnnexurePDF(shipment, exporter);
    
    res.set({ 
      'Content-Type': 'application/pdf', 
      'Content-Disposition': `attachment; filename=Annexure-${shipment.invoiceNumber || 'Download'}.pdf` 
    });
    res.send(pdfBuffer);
  } catch (error) {
    console.error("🔥 PDF Generation Error (Annexure):", error);
    res.status(500).json({ message: 'Error generating Annexure' });
  }
});

module.exports = router;