const express = require('express');
const router = express.Router();
const { generateMasterFormPdf, generateMasterFormUsdPdf, generateMasterFormPackingListPdf, generateMasterFormVgmPdf, generateMasterFormAnnexurePdf, previewInvoiceHtml } = require('../controllers/invoiceController');

// POST /api/master-form/generate-pdf (INR Invoice)
router.post('/generate-pdf', generateMasterFormPdf);

// POST /api/master-form/generate-usd-pdf (Commercial USD Invoice)
router.post('/generate-usd-pdf', generateMasterFormUsdPdf);

// POST /api/master-form/generate-packing-list-pdf (Packing List PDF)
router.post('/generate-packing-list-pdf', generateMasterFormPackingListPdf);

// POST /api/master-form/generate-vgm-pdf (VGM Annexure-1)
router.post('/generate-vgm-pdf', generateMasterFormVgmPdf);

// POST /api/master-form/generate-annexure-pdf (Annexure Customs PDF)
router.post('/generate-annexure-pdf', generateMasterFormAnnexurePdf);

// POST /api/master-form/invoice-preview
router.post('/invoice-preview', previewInvoiceHtml);

// GET /api/master-form/invoice-preview/:id
router.get('/invoice-preview/:id', previewInvoiceHtml);

module.exports = router;
