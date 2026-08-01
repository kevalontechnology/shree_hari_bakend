const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const { generateInrInvoicePdf } = require('../services/pdfService');
const { renderVgmHtml } = require('../templates/vgmTemplate');

// Helper to safely launch Puppeteer on Render cloud environments
async function getBrowser() {
  chromium.setHeadlessMode = true;
  chromium.setGraphicsMode = false;

  const executablePath = await chromium.executablePath();

  return await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: executablePath,
    headless: chromium.headless,
    ignoreHTTPSErrors: true,
  });
}

// ---------------------------------------------------------
// 1. INVOICE PDF GENERATOR
// ---------------------------------------------------------
const generateInvoicePDF = async (shipment, exporter) => {
  return await generateInrInvoicePdf({
    ...(shipment ? (typeof shipment.toObject === 'function' ? shipment.toObject() : shipment) : {}),
    exporter,
    exporterDetails: {
      ...exporter,
      ...(shipment?.exporterDetails || {})
    }
  });
};

// ---------------------------------------------------------
// 2. PACKAGING LIST PDF GENERATOR
// ---------------------------------------------------------
const generatePackagingListPDF = async (shipment, exporter) => {
  const products = shipment?.products || [];
  const containers = shipment?.containers || [];
  const exporterData = {
    ...exporter,
    ...(shipment?.exporterDetails || {}),
    consignee: shipment?.exporterDetails?.consignee || shipment?.consignee || exporter?.consignee,
    officeAddress: shipment?.exporterDetails?.officeAddress || exporter?.officeAddress || exporter?.companyAddress,
    officeNumber: shipment?.exporterDetails?.officeNumber || exporter?.officeNumber,
    website: shipment?.exporterDetails?.website || exporter?.website,
    binNo: shipment?.exporterDetails?.binNo || exporter?.binNo,
    lutNo: shipment?.exporterDetails?.lutNo || exporter?.lutNo,
  };

  const primaryBuyerDoc = shipment?.primaryBuyer
    ? { ...(typeof shipment.primaryBuyer.toObject === 'function' ? shipment.primaryBuyer.toObject() : shipment.primaryBuyer), ...(shipment?.buyerDetails || {}) }
    : { ...(shipment?.buyerDetails || {}) };

  const notifyParty = shipment?.notifyParties?.[0] || primaryBuyerDoc;
  const secondNotifyParty = shipment?.notifyParties?.[1]
    ? (typeof shipment.notifyParties[1].toObject === 'function' ? shipment.notifyParties[1].toObject() : shipment.notifyParties[1])
    : null;

  const effectiveDischargePort = shipment?.dischargePort?.portName || shipment?.dischargePort || shipment?.portOfDischarge || "MUNDRA";
  const effectiveFinalDestination = shipment?.finalDestination || effectiveDischargePort;

  let totalPackagesCount = 0;
  let totalNetWeight = 0;
  let totalGrossWeight = 0;

  const renderProducts = products
    .map((p) => {
      const pkgs = Number(p.packagesCount || p.packages || 0) || 0;
      const qty = Number(p.quantity) || 0;
      const unit = p.quantityUnit || p.unit || "SET";
      const netWt = Number(p.netWeightKG || p.netWeight || 0) || 0;
      const grossWt = Number(p.grossWeightKG || p.grossWeight || 0) || 0;
      totalPackagesCount += pkgs;
      totalNetWeight += netWt;
      totalGrossWeight += grossWt;
      return `
      <tr class="align-center">
        <td>${pkgs}</td>
        <td style="text-align: left; text-transform: uppercase; font-weight: bold;">${p.productName || "CERAMIC ITEM"}</td>
        <td>${qty}</td>
        <td>${unit}</td>
        <td>${netWt.toFixed(2)}</td>
        <td>${grossWt.toFixed(2)}</td>
      </tr>
    `;
    })
    .join("");

  const finalTotalPkgs = totalPackagesCount || 1504;
  const finalTotalNetWeight = totalNetWeight || 25140.0;
  const finalTotalGrossWeight = totalGrossWeight || 25339.0;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #000; font-size: 10px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        th, td { border: 1px solid #000; padding: 4px; vertical-align: top; }
        .document-title { text-align: center; font-weight: bold; font-size: 14px; padding: 6px; background-color: #f2f2f2; }
        .field-title { font-weight: bold; display: block; margin-bottom: 2px; }
        .align-center { text-align: center; }
      </style>
    </head>
    <body>
      <table class="master-table">
        <tr><td colspan="6" class="document-title">PACKING LIST</td></tr>
        <tr>
          <td colspan="3" style="width: 50%;">
            <span class="field-title">Exporter:-</span>
            <strong>${exporterData?.companyName || "SHREE HARI EXPORT HOUSE"}</strong><br>
            ${exporterData?.registeredAddress || exporterData?.officeAddress || exporterData?.companyAddress || "GUJARAT, INDIA"}
          </td>
          <td colspan="3" style="width: 50%;">
            <strong>Invoice No :-</strong> ${shipment?.invoiceNumber || "EXP 6"}<br>
            <strong>Date :-</strong> ${shipment?.invoiceDate ? new Date(shipment.invoiceDate).toLocaleDateString("en-GB") : "14.04.2025"}
          </td>
        </tr>
      </table>
      <table>
        <tr class="product-table">
          <th>Packages</th>
          <th>Description</th>
          <th>Qty</th>
          <th>Unit</th>
          <th>Net Wt</th>
          <th>Gross Wt</th>
        </tr>
        ${renderProducts}
      </table>
    </body>
    </html>
  `;

  let browser = null;
  try {
    browser = await getBrowser();
    const page = await browser.newPage();
    await page.setContent(htmlContent, { 
      waitUntil: "domcontentloaded",
      timeout: 30000 
    });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" },
    });
    return pdfBuffer;
  } finally {
    if (browser !== null) await browser.close();
  }
};

// ---------------------------------------------------------
// 3. ANNEXURE PDF GENERATOR
// ---------------------------------------------------------
const generateAnnexurePDF = async (shipment, exporter) => {
  const exporterData = {
    ...exporter,
    ...(shipment?.exporterDetails || {}),
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><style>body { font-family: Arial, sans-serif; padding: 20px; }</style></head>
    <body>
      <h2>ANNEXURE</h2>
      <p>Exporter: ${exporterData?.companyName || "SHREE HARI EXPORT HOUSE"}</p>
    </body>
    </html>
  `;

  let browser = null;
  try {
    browser = await getBrowser();
    const page = await browser.newPage();
    await page.setContent(htmlContent, { 
      waitUntil: "domcontentloaded",
      timeout: 30000 
    });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0mm", bottom: "0mm", left: "0mm", right: "0mm" },
    });
    return pdfBuffer;
  } finally {
    if (browser !== null) await browser.close();
  }
};

// ---------------------------------------------------------
// 4. VGM PDF GENERATOR
// ---------------------------------------------------------
const generateVGMPDF = async (shipment, exporter) => {
  let browser = null;
  try {
    const renderPayload = {
      ...(shipment ? (typeof shipment.toObject === 'function' ? shipment.toObject() : shipment) : {}),
      exporter: exporter || {}
    };
    const htmlContent = renderVgmHtml(renderPayload);
    
    browser = await getBrowser();
    const page = await browser.newPage();
    await page.setContent(htmlContent, { 
      waitUntil: "domcontentloaded",
      timeout: 30000 
    });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0mm", bottom: "0mm", left: "0mm", right: "0mm" },
    });
    return pdfBuffer;
  } catch (err) {
    console.error("Error in generateVGMPDF:", err);
    throw err;
  } finally {
    if (browser !== null) await browser.close();
  }
};

const generateQuotationPDF = async (shipment) => {};

module.exports = {
  generateInvoicePDF,
  generatePackagingListPDF,
  generateVGMPDF,
  generateQuotationPDF,
  generateAnnexurePDF,
};