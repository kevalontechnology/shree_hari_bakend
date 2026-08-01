const { renderInrInvoiceHtml } = require('../templates/inrInvoiceTemplate');
const { renderUsdInvoiceHtml } = require('../templates/usdInvoiceTemplate');
const { renderPackingListHtml } = require('../templates/packingListTemplate');
const { renderVgmHtml } = require('../templates/vgmTemplate');
const { renderAnnexureHtml } = require('../templates/annexureTemplate');
const { generatePdfFromHtml } = require('../services/pdfService');
const Shipment = require('../models/Shipment');
const { Exporter } = require('../models/ReferenceData');

/**
 * Helper to validate 9 Exporter fields
 */
function validateExporterFields(exporterDetails = {}) {
  const errors = [];
  const companyName = exporterDetails.companyName || exporterDetails.name;
  const companyAddress = exporterDetails.companyAddress || exporterDetails.address;
  const consignee = exporterDetails.consignee;
  const iecNo = exporterDetails.iecNo || exporterDetails.iecNumber;
  const gstNo = exporterDetails.gstNo || exporterDetails.gstNumber;
  const binNo = exporterDetails.binNo || exporterDetails.binNumber;

  if (!companyName || !companyName.trim()) {
    errors.push('Company Name is required.');
  }
  if (!companyAddress || !companyAddress.trim()) {
    errors.push('Company Address is required.');
  }
  if (!consignee || !consignee.trim()) {
    errors.push('Consignee is required.');
  }
  if (!iecNo || !iecNo.trim()) {
    errors.push('IEC Number is required.');
  }
  if (!gstNo || !gstNo.trim()) {
    errors.push('GST Number is required.');
  }
  if (!binNo || !binNo.trim()) {
    errors.push('BIN Number is required.');
  }

  return errors;
}

/**
 * Controller: Generate PDF for Master Form submission
 * POST /api/master-form/generate-pdf
 */
async function generateMasterFormPdf(req, res) {
  try {
    const formData = req.body || {};
    const exporterDetails = formData.exporterDetails || {};

    // Fetch default database Exporter if fields missing
    let exporterDoc = {};
    try {
      exporterDoc = (await Exporter.findOne()) || {};
    } catch (dbErr) {
      console.warn('Could not fetch default Exporter from DB:', dbErr.message);
    }

    const mergedExporter = {
      ...exporterDoc._doc,
      ...exporterDoc,
      ...exporterDetails
    };

    // Compile payload
    const renderPayload = {
      ...formData,
      exporter: mergedExporter,
      exporterDetails: mergedExporter
    };

    // Render HTML invoice
    const invoiceHtml = renderInrInvoiceHtml(renderPayload);

    // Convert HTML to PDF buffer
    const pdfBuffer = await generatePdfFromHtml(invoiceHtml);

    const safeCompanyName = (exporterDetails.companyName || 'Exporter')
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `INR-Invoice-${safeCompanyName}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length
    });

    return res.send(pdfBuffer);
  } catch (error) {
    console.error('🔥 Master Form PDF Generation Error:', error);
    return res.status(500).json({
      message: 'Failed to generate PDF invoice',
      error: error.message
    });
  }
}

/**
 * Controller: Generate VGM PDF for Master Form submission
 * POST /api/master-form/generate-vgm-pdf
 */
async function generateMasterFormVgmPdf(req, res) {
  try {
    const formData = req.body || {};
    const exporterDetails = formData.exporterDetails || {};

    let exporterDoc = {};
    try {
      exporterDoc = (await Exporter.findOne()) || {};
    } catch (dbErr) {
      console.warn('Could not fetch default Exporter from DB:', dbErr.message);
    }

    const mergedExporter = {
      ...exporterDoc._doc,
      ...exporterDoc,
      ...exporterDetails
    };

    const renderPayload = {
      ...formData,
      exporter: mergedExporter,
      exporterDetails: mergedExporter
    };

    const vgmHtml = renderVgmHtml(renderPayload);
    const pdfBuffer = await generatePdfFromHtml(vgmHtml);

    const safeCompanyName = (exporterDetails.companyName || 'Exporter')
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `VGM-${safeCompanyName}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length
    });

    return res.send(pdfBuffer);
  } catch (error) {
    console.error('🔥 Master Form VGM PDF Generation Error:', error);
    return res.status(500).json({
      message: 'Failed to generate VGM PDF',
      error: error.message
    });
  }
}

/**
 * Controller: Generate Commercial USD Invoice PDF for Master Form submission
 * POST /api/master-form/generate-usd-pdf
 */
async function generateMasterFormUsdPdf(req, res) {
  try {
    const formData = req.body || {};
    const exporterDetails = formData.exporterDetails || {};

    let exporterDoc = {};
    try {
      exporterDoc = (await Exporter.findOne()) || {};
    } catch (dbErr) {
      console.warn('Could not fetch default Exporter from DB:', dbErr.message);
    }

    const mergedExporter = {
      ...exporterDoc._doc,
      ...exporterDoc,
      ...exporterDetails
    };

    const renderPayload = {
      ...formData,
      exporter: mergedExporter,
      exporterDetails: mergedExporter
    };

    const usdHtml = renderUsdInvoiceHtml(renderPayload);
    const pdfBuffer = await generatePdfFromHtml(usdHtml);

    const safeCompanyName = (exporterDetails.companyName || 'Exporter')
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Invoice-${safeCompanyName}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length
    });

    return res.send(pdfBuffer);
  } catch (error) {
    console.error('🔥 Master Form Commercial Invoice PDF Generation Error:', error);
    return res.status(500).json({
      message: 'Failed to generate Commercial Invoice PDF',
      error: error.message
    });
  }
}

/**
 * Controller: Generate Annexure PDF for Master Form submission
 * POST /api/master-form/generate-annexure-pdf
 */
async function generateMasterFormAnnexurePdf(req, res) {
  try {
    const formData = req.body || {};
    const exporterDetails = formData.exporterDetails || {};

    let exporterDoc = {};
    try {
      exporterDoc = (await Exporter.findOne()) || {};
    } catch (dbErr) {
      console.warn('Could not fetch default Exporter from DB:', dbErr.message);
    }

    const mergedExporter = {
      ...exporterDoc._doc,
      ...exporterDoc,
      ...exporterDetails
    };

    const renderPayload = {
      ...formData,
      exporter: mergedExporter,
      exporterDetails: mergedExporter
    };

    const annexureHtml = renderAnnexureHtml(renderPayload);
    const pdfBuffer = await generatePdfFromHtml(annexureHtml);

    const safeCompanyName = (exporterDetails.companyName || 'Exporter')
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Annexure-${safeCompanyName}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length
    });

    return res.send(pdfBuffer);
  } catch (error) {
    console.error('🔥 Master Form Annexure PDF Generation Error:', error);
    return res.status(500).json({
      message: 'Failed to generate Annexure PDF',
      error: error.message
    });
  }
}

/**
 * Controller: Generate Packing List PDF for Master Form submission
 * POST /api/master-form/generate-packing-list-pdf
 */
async function generateMasterFormPackingListPdf(req, res) {
  try {
    const formData = req.body || {};
    const exporterDetails = formData.exporterDetails || {};

    let exporterDoc = {};
    try {
      exporterDoc = (await Exporter.findOne()) || {};
    } catch (dbErr) {
      console.warn('Could not fetch default Exporter from DB:', dbErr.message);
    }

    const mergedExporter = {
      ...exporterDoc._doc,
      ...exporterDoc,
      ...exporterDetails
    };

    const renderPayload = {
      ...formData,
      exporter: mergedExporter,
      exporterDetails: mergedExporter
    };

    const packingListHtml = renderPackingListHtml(renderPayload);
    const pdfBuffer = await generatePdfFromHtml(packingListHtml);

    const safeCompanyName = (exporterDetails.companyName || 'Exporter')
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Packing-List-${safeCompanyName}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length
    });

    return res.send(pdfBuffer);
  } catch (error) {
    console.error('🔥 Master Form Packing List PDF Generation Error:', error);
    return res.status(500).json({
      message: 'Failed to generate Packing List PDF',
      error: error.message
    });
  }
}

/**
 * Controller: Preview Invoice HTML in Browser
 * POST /api/master-form/invoice-preview
 * GET /api/master-form/invoice-preview/:id
 */
async function previewInvoiceHtml(req, res) {
  try {
    let renderPayload = {};

    if (req.params?.id) {
      const shipment = await Shipment.findById(req.params.id)
        .populate('primaryBuyer')
        .populate('notifyParties')
        .populate('manufacturer')
        .populate('loadingPort dischargePort gatewayPort');
      
      const exporterDoc = (await Exporter.findOne()) || {};
      renderPayload = {
        ...(shipment ? shipment.toObject() : {}),
        exporter: exporterDoc
      };
    } else {
      const formData = req.body || {};
      const exporterDoc = (await Exporter.findOne()) || {};
      renderPayload = {
        ...formData,
        exporter: exporterDoc
      };
    }

    const html = renderInrInvoiceHtml(renderPayload);
    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  } catch (error) {
    console.error('🔥 Invoice Preview Error:', error);
    return res.status(500).send(`<h2>Error rendering invoice preview</h2><pre>${error.message}</pre>`);
  }
}

module.exports = {
  generateMasterFormPdf,
  generateMasterFormUsdPdf,
  generateMasterFormPackingListPdf,
  generateMasterFormVgmPdf,
  generateMasterFormAnnexurePdf,
  previewInvoiceHtml
};
