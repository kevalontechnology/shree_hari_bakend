const express = require('express');
const router = express.Router();
const { generateMasterFormPdf, previewInvoiceHtml } = require('../controllers/invoiceController');

// POST /api/pdf/generate-pdf or POST /api/master-form/generate-pdf
router.post('/generate-pdf', generateMasterFormPdf);
router.post('/invoice-preview', previewInvoiceHtml);
router.get('/invoice-preview/:id', previewInvoiceHtml);

module.exports = router;
