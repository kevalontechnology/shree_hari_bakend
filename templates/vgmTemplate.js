const fs = require('fs');
const path = require('path');

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function imageToBase64(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const file = fs.readFileSync(filePath);
      const ext = path.extname(filePath).slice(1).toLowerCase();
      const mimeType = ext === 'svg' ? 'image/svg+xml' : `image/${ext === 'jpg' ? 'jpeg' : ext}`;
      const base64 = file.toString('base64');
      return `data:${mimeType};base64,${base64}`;
    }
  } catch (err) {
    console.warn(`⚠️ Failed to read image at ${filePath}:`, err.message);
  }
  return '';
}

function resolveImagePath(imgUrl, defaultFileName) {
  const defaultPath = path.join(__dirname, '../assets/invoice', defaultFileName);
  if (imgUrl) {
    const cleanUrl = imgUrl.startsWith('/') ? imgUrl.slice(1) : imgUrl;
    const fullPath = path.join(__dirname, '..', cleanUrl);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }
  return defaultPath;
}

function renderVgmHtml(data = {}) {
  const exporterDetails = data.exporterDetails || {};
  const exporter = data.exporter || {};
  const buyerDetails = data.buyerDetails || {};

  const companyName = escapeHtml(exporterDetails.companyName || exporter.companyName || 'SHREE HARI EXPORT HOUSE');
  const companyAddress = escapeHtml(exporterDetails.companyAddress || exporter.companyAddress || '201,SURVEY NO.95 P2 PLOT NO.2,NEAR NILKANTH PARK,MORBI,GUJARAT , INDIA');
  const officeAddress = escapeHtml(exporterDetails.officeAddress || exporter.officeAddress || '201, Survey No.95 P2, Plot No.2, Near Nilkanth Park, Morbi-2, Gujarat, INDIA.');
  const officeNumber = escapeHtml(exporterDetails.officeNumber || exporter.officeNumber || '+91 97140 15071');
  const website = escapeHtml(exporterDetails.website || exporter.website || 'www.osissanitaryware.com');
  const iecNo = escapeHtml(exporterDetails.iecNo || exporterDetails.iecNumber || exporter.iecNo || 'ADSFS7838P');

  const shipperAuthorizedName = escapeHtml(buyerDetails.shipperAuthorizeName || exporterDetails.consignee || 'MR. KISHORBHAI');
  const shipper24x7Contact = escapeHtml(buyerDetails.shipperMan24x7 || 'MR. KISHORBHAI');

  const firstContainer = (data.containers && data.containers.length > 0) ? data.containers[0] : {};

  // 1. Dynamic Container Number (Row 5)
  const rawContainerNo = firstContainer.containerNumber || firstContainer.containerNo || data.containerNumber;
  const containerNo = escapeHtml(rawContainerNo ? String(rawContainerNo).trim() : 'HLBU 1764245');

  // Dynamic Container Size (Row 6)
  const rawSize = firstContainer.size || firstContainer.containerQuantity;
  const containerSize = escapeHtml(rawSize ? String(rawSize).trim().toUpperCase() : '1X40');

  // 2. Dynamic Max Weight KG (Row 7)
  const rawMaxWeight = firstContainer.maxWeightKG || firstContainer.maxWeight || data.maxWeight;
  const maxWeightCsc = rawMaxWeight ? `${rawMaxWeight} KGS` : '32500 KGS';

  // 3. Dynamic Calculation for Verified Gross Mass (Row 8)
  let totalProductWt = 0;
  if (data.products && Array.isArray(data.products) && data.products.length > 0) {
    data.products.forEach(p => {
      const gWt = parseFloat(p.grossWeightKG || p.grossWeight || 0);
      const nWt = parseFloat(p.netWeightKG || p.netWeight || 0);
      // Prefer Gross Weight if available (> 0), otherwise use Net Weight
      const effectiveWt = (gWt > 0) ? gWt : nWt;
      if (!isNaN(effectiveWt) && effectiveWt > 0) {
        totalProductWt += effectiveWt;
      }
    });
  }

  if (totalProductWt === 0) {
    totalProductWt = 25339; // Default fallback to sample screenshot
  }

  // Dynamic Tare Weight (from Master Form container details)
  const rawTareWt = firstContainer.tareWeightKG || firstContainer.tareWeight || firstContainer.tare || data.tareWeight;
  const tareWt = (rawTareWt && !isNaN(parseFloat(rawTareWt)) && parseFloat(rawTareWt) > 0)
    ? parseFloat(rawTareWt)
    : 3900;

  const totalVgm = totalProductWt + tareWt;
  const verifiedGrossMass = `${totalProductWt} KGS + ${tareWt} KGS = ${totalVgm} KGS`;

  const containerType = escapeHtml(firstContainer.type || 'NORMAL').toUpperCase();
  const invoiceDate = escapeHtml(data.invoiceDate ? new Date(data.invoiceDate).toLocaleDateString('en-GB').replace(/\//g, '.') : '14.04.2025');

  const logoPath = resolveImagePath(exporterDetails.logoImage || exporter.logoImage, 'logo.jpg');
  const signaturePath = resolveImagePath(exporterDetails.signatureImage || exporter.signatureImage, 'signature.jpg');

  const logoBase64 = imageToBase64(logoPath);
  const signatureBase64 = imageToBase64(signaturePath);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>EXP 6 VGM</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    html, body {
      width: 210mm;
      height: 297mm;
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #000000;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 8.5pt;
      line-height: 1.25;
    }
    .vgm-page {
      position: relative;
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 8mm 10mm;
      box-sizing: border-box;
      background: #ffffff;
    }
    .brand-header {
      width: 100%;
      margin-bottom: 4mm;
      border-collapse: collapse;
    }
    .brand-header td {
      border: none !important;
      padding: 0;
      vertical-align: middle;
    }
    .logo-img {
      max-height: 55px;
      width: auto;
      display: block;
    }
    .corporate-info {
      width: 290px;
      text-align: left;
      font-size: 8pt;
      line-height: 1.3;
      color: #000000;
    }
    .orange-accent-bar {
      width: 12px;
      height: 50px;
      background-color: #e57c1e;
      float: right;
      display: block;
    }
    .outer-border-box {
      border: 1.5px solid #000000;
      padding: 4mm 4mm 4mm 4mm;
      box-sizing: border-box;
    }
    .title-annexure {
      text-align: center;
      font-weight: bold;
      font-size: 11pt;
      margin-bottom: 1.5mm;
      letter-spacing: 0.5px;
    }
    .title-sub {
      text-align: center;
      font-weight: bold;
      font-size: 10.5pt;
      text-decoration: underline;
      margin-bottom: 3.5mm;
      letter-spacing: 0.3px;
    }
    .vgm-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 0;
      border: 1px solid #000000;
    }
    .vgm-table th, .vgm-table td {
      border: 1px solid #000000;
      padding: 2.2mm 3mm;
      font-size: 8.5pt;
      vertical-align: middle;
      word-wrap: break-word;
    }
    .vgm-table thead tr {
      background-color: #dce6f1;
    }
    .vgm-table tbody tr.row-shaded {
      background-color: #dce6f1;
    }
    .vgm-table tbody tr.row-white {
      background-color: #ffffff;
    }
    .text-center { text-align: center; }
    .bold { font-weight: bold; }
    
    .signature-container {
      width: 100%;
      border: 1px solid #000000;
      border-top: none;
      padding: 4mm 6mm 5mm 6mm;
      box-sizing: border-box;
    }
    .signature-flex {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .sig-right {
      text-align: center;
    }
    .sig-title {
      font-size: 8.5pt;
      font-weight: bold;
      margin-bottom: 2mm;
    }
    .sig-company {
      font-size: 9pt;
      font-weight: bold;
      color: #1d4ed8;
      margin-top: 1mm;
    }
    .sig-name-sub {
      font-size: 8.5pt;
      font-weight: bold;
      color: #1d4ed8;
    }
    .sig-partner {
      font-size: 8pt;
      font-weight: bold;
      color: #1d4ed8;
    }
    .sig-img {
      max-height: 48px;
      margin: 1mm auto;
      display: block;
    }
    .date-row {
      font-size: 8.5pt;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="vgm-page">
    <!-- 1. Header Row (Above Border Box) -->
    <table class="brand-header">
      <colgroup>
        <col style="width: 42%;">
        <col style="width: 54%;">
        <col style="width: 4%;">
      </colgroup>
      <tr>
        <td>
          ${logoBase64 ? `<img src="${logoBase64}" alt="Logo" class="logo-img">` : `<div style="font-size: 16pt; font-weight: bold; color: #1d4ed8;">Shree Hari Export House</div>`}
        </td>
        <td class="corporate-info">
          <strong>Corporate Office :</strong><br>
          ${officeAddress}<br>
          <strong>E-mail :</strong> shreehariexporthouse@gmail.com,&nbsp; osissanitarywares@gmail.com<br>
          <strong>Web :</strong> ${website} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <strong>Ph.:</strong> ${officeNumber}
        </td>
        <td>
          <div class="orange-accent-bar"></div>
        </td>
      </tr>
    </table>

    <!-- 2. Outer Border Box (Starts from ANNEXURE – 1) -->
    <div class="outer-border-box">
      <!-- Sub-headers -->
      <div class="title-annexure">ANNEXURE – 1</div>
      <div class="title-sub">INFORMATION ABOUT VERIFIED GROSS MASS OF CONTAINER</div>

      <!-- 3. Particulars Table -->
      <table class="vgm-table">
        <colgroup>
          <col style="width: 8%;">
          <col style="width: 46%;">
          <col style="width: 46%;">
        </colgroup>
        <thead>
          <tr>
            <th class="text-center">Sr No.</th>
            <th>Details of information</th>
            <th>Particulars</th>
          </tr>
        </thead>
        <tbody>
          <tr class="row-shaded">
            <td class="text-center">1</td>
            <td>Name of the shipper</td>
            <td>
              <div class="bold">${companyName}</div>
              <div>${companyAddress}</div>
            </td>
          </tr>
          <tr class="row-white">
            <td class="text-center">2</td>
            <td>Shipper Registration /License no.( IEC No/CIN No)**</td>
            <td class="bold">${iecNo}</td>
          </tr>
          <tr class="row-white">
            <td class="text-center">3</td>
            <td>Name and designation of official of the shipper authorized to sign document</td>
            <td>${shipperAuthorizedName}</td>
          </tr>
          <tr class="row-white">
            <td class="text-center">4</td>
            <td>24 x 7 contact details of authorized official of shipper</td>
            <td>${shipper24x7Contact}</td>
          </tr>
          <tr class="row-white">
            <td class="text-center">5</td>
            <td>Container No.</td>
            <td class="bold" style="font-size: 10pt;">${containerNo}</td>
          </tr>
          <tr class="row-white">
            <td class="text-center">6</td>
            <td>Container Size ( TEU/FEU/other)</td>
            <td>${containerSize}</td>
          </tr>
          <tr class="row-white">
            <td class="text-center">7</td>
            <td>Maximum permissible weight of container as per the CSC plate</td>
            <td>${maxWeightCsc}</td>
          </tr>
          <tr class="row-white">
            <td class="text-center">8</td>
            <td>Verified gross mass of container (method-1/method-2)</td>
            <td class="bold">${verifiedGrossMass}</td>
          </tr>
          <tr class="row-white">
            <td class="text-center">9</td>
            <td>Type (Normal/Reefer/Hazardous/others)</td>
            <td>NORMAL</td>
          </tr>
          <tr class="row-shaded">
            <td class="text-center">10</td>
            <td>If Hazardous UN NO.IMDG class</td>
            <td>N.A.</td>
          </tr>
        </tbody>
      </table>

      <!-- 4. Signature & Date Section -->
      <div class="signature-container">
        <div class="signature-flex">
          <div class="date-row">
            DATE &nbsp; ${invoiceDate}
          </div>

          <div class="sig-right">
            <div class="sig-title">Signature of Authorized Person of Shipper</div>
            ${signatureBase64 ? `<img src="${signatureBase64}" alt="Signature" class="sig-img">` : `
              <div class="sig-company">${companyName}</div>
              <div class="sig-name-sub">K. v. Patel</div>
              <div class="sig-partner">Partner</div>
            `}
            <div style="font-size: 8.5pt; margin-top: 2mm;">Name- ${shipperAuthorizedName}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

  return html;
}

module.exports = {
  renderVgmHtml
};
