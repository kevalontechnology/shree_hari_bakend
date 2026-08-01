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

function renderAnnexureHtml(data = {}) {
  const exporterDetails = data.exporterDetails || {};
  const exporter = data.exporter || {};
  const manufacturerDetails = data.manufacturerDetails || {};
  const rangeData = data.rangeDataId || data.rangeData || {};

  const companyName = escapeHtml(exporterDetails.companyName || exporter.companyName || 'SHREE HARI EXPORT HOUSE');
  const registeredAddress = escapeHtml(exporterDetails.companyAddress || exporter.companyAddress || exporter.registeredAddress || 'SHOP NO. 1, SECOND FLOOR, SURVEY NO. 95 P2 PLOT NO. 2, NEAR NILKANTH PARK SOCIETY, MORBI, GUJARAT, INDIA');
  const iecNo = escapeHtml(exporterDetails.iecNo || exporterDetails.iecNumber || exporter.iecNo || 'ADSFS7838P');
  const branchCode = escapeHtml(exporterDetails.branchCode || exporter.branchCode || '00');
  const binNo = escapeHtml(exporterDetails.binNo || exporterDetails.binNumber || exporter.binNo || 'ADSFS7838P FT 001');

  const manufacturerName = escapeHtml(manufacturerDetails.companyName || data.manufacturerName || companyName);
  const factoryAddress = escapeHtml(manufacturerDetails.address || manufacturerDetails.companyAddress || registeredAddress);

  const invoiceNumber = escapeHtml(data.invoiceNumber || 'EXP 6');
  const invoiceDate = escapeHtml(data.invoiceDate ? new Date(data.invoiceDate).toLocaleDateString('en-GB').replace(/\//g, '.') : '14.04.2025');
  const examinationDate = escapeHtml(data.examinationDate ? new Date(data.examinationDate).toLocaleDateString('en-GB').replace(/\//g, '.') : invoiceDate);

  const examiningOfficer = escapeHtml(data.examiningOfficer || 'INSPECTOR');
  const supervisingOfficer = escapeHtml(data.supervisingOfficer || 'SUPERINTENDENT');

  const rName = escapeHtml(rangeData.range ? String(rangeData.range).toUpperCase() : 'CHOTILA');
  const rCode = escapeHtml(rangeData.rangeCode || '04');
  const dName = escapeHtml(rangeData.division ? String(rangeData.division).toUpperCase() : 'SURENDRANAGAR');
  const dCode = escapeHtml(rangeData.divisionCode || '05');
  const cName = escapeHtml(rangeData.commissionerate ? String(rangeData.commissionerate).toUpperCase() : 'BHAVNAGAR');
  const cCode = escapeHtml(rangeData.commissionerateCode || 'WW');

  const consignee = escapeHtml(exporterDetails.consignee || data.consignee || 'TO ORDER');
  const portOfDischarge = escapeHtml(data.dischargePortName || (data.dischargePort && data.dischargePort.portName) || 'IQUIQUE, CHILE');

  const products = Array.isArray(data.products) ? data.products : [];
  let totalPackages = 0;
  products.forEach(p => {
    const qty = Number(p.quantity || 0);
    const unit = String(p.quantityUnit || 'PCS').toUpperCase();
    const isSet = unit.includes('SET');
    totalPackages += (isSet ? qty * 2 : qty);
  });
  if (totalPackages === 0) totalPackages = 1504;

  const containers = (Array.isArray(data.containers) && data.containers.length > 0) ? data.containers : [
    { containerNumber: 'HLBU 1764245', size: '1X40', lineSealNumber: 'HLK 2785464', electronicSealNumber: 'WIND 02261339' }
  ];

  const firstContainer = containers[0] || {};
  const exciseSealNo = escapeHtml(firstContainer.lineSealNumber || data.exciseSealNo || 'CARGO');
  const cargoType = escapeHtml(firstContainer.type || 'CONTAINERAISED CARGO');
  const permissionNo = escapeHtml(manufacturerDetails.permissionNumber || data.permissionNo || 'PER/12345');
  const availingITC = escapeHtml(data.availingITC || 'YES');
  const aeoNo = escapeHtml(exporterDetails.aeoNo || exporter.aeoNo || 'AEO1234567');

  const containerRowsHtml = containers.map(c => `
    <tr>
      <td style="border-left: none; border-right: none;">${escapeHtml(c.containerNumber || 'HLBU 1764245')}</td>
      <td style="border-left: none; border-right: none;">${escapeHtml(c.size || c.containerQuantity || '1X40')}</td>
      <td style="border-left: none; border-right: none;">${totalPackages}</td>
      <td style="border-left: none; border-right: none;">${escapeHtml(c.lineSealNumber || 'HLK 2785464')}</td>
      <td style="border-left: none; border-right: none;">${escapeHtml(c.electronicSealNumber || c.electronicsSealNumber || 'WIND 02261339')}</td>
    </tr>
  `).join('');

  const goodsPurchases = Array.isArray(data.goodsPurchases) ? data.goodsPurchases : [
    { billNo: '101', date: invoiceDate, companyName: manufacturerName, gstNo: manufacturerDetails.gstNo || '24AAACR1234F1Z1' }
  ];

  const goodsPurchaseRowsHtml = goodsPurchases.map(gp => `
    <tr>
      <td style="border-left: none;">${escapeHtml(gp.billNo || '101')}</td>
      <td>${escapeHtml(gp.date || invoiceDate)}</td>
      <td>${escapeHtml(gp.companyName || manufacturerName)}</td>
      <td style="border-right: none;">${escapeHtml(gp.gstNo || '24AAACR1234F1Z1')}</td>
    </tr>
  `).join('');

  const signaturePath = resolveImagePath(exporterDetails.signatureImage || exporter.signatureImage, 'signature.jpg');
  const footerPath = resolveImagePath(exporterDetails.footerImage || exporter.footerImage, 'footer-strip.jpg');

  const signatureBase64 = imageToBase64(signaturePath);
  const footerBase64 = imageToBase64(footerPath);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ANNEXURE</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm;
    }
    * { box-sizing: border-box; }
    body {
      font-family: "Times New Roman", Times, serif;
      margin: 0;
      padding: 0;
      color: #000000;
      font-size: 10pt;
      line-height: 1.2;
      background-color: #ffffff;
    }

    .main-container {
      border: 1.5px solid #000000;
      width: 100%;
      box-sizing: border-box;
    }

    .title-box {
      text-align: center;
      font-size: 11pt;
      font-weight: bold;
      border-bottom: 1.5px solid #000000;
      padding: 4px 0;
      text-transform: uppercase;
    }

    .subtitle-box {
      text-align: center;
      font-size: 10pt;
      font-weight: bold;
      border-bottom: 1.5px solid #000000;
      padding: 4px 0;
      text-transform: uppercase;
    }

    .annex-table {
      width: 100%;
      border-collapse: collapse;
    }

    .annex-table td {
      border-bottom: 1px solid #000000;
      padding: 3px 5px;
      vertical-align: top;
      font-size: 9.5pt;
      line-height: 1.25;
    }

    .col-sr { width: 5%; text-align: center; border-right: 1px solid #000000; }
    .col-particulars { width: 53%; border-right: 1px solid #000000; }
    .col-colon { width: 3%; text-align: center; border-right: 1px solid #000000; }
    .col-details { width: 39%; }

    .grid-table {
      width: 100%;
      border-collapse: collapse;
    }
    .grid-table th, .grid-table td {
      border: 1px solid #000000;
      padding: 3px 5px;
      text-align: center;
      font-size: 9.5pt;
    }
    .grid-table th {
      text-transform: uppercase;
      font-weight: bold;
    }

    .signature-section {
      padding: 12px 15px 10px 15px;
      font-size: 9.5pt;
    }

    .bold { font-weight: bold; }
    .uppercase { text-transform: uppercase; }
  </style>
</head>
<body>

  <div class="main-container">
    <!-- Document Titles -->
    <div class="title-box">ANNEXURE</div>
    <div class="subtitle-box">
      OFFICE OF THE SUPERINTENDENT OF CGST <br>
      RANGE : ${rName} , DIVISION : ${dName} , COMMISSIONERATE : ${cName}
    </div>

    <!-- Main Particulars Table -->
    <table class="annex-table">
      <tbody>
        <tr>
          <td class="col-sr">1</td>
          <td class="col-particulars">NAME OF THE EXPORTER</td>
          <td class="col-colon">:-</td>
          <td class="col-details">
            <strong>${companyName}</strong><br>
            ${registeredAddress}
          </td>
        </tr>

        <tr>
          <td class="col-sr">2</td>
          <td class="col-particulars">
            a) IEC NO.<br>
            b) BRANCH CODE<br>
            c) BIN (PAN BASED BUSINESS INDENTIFICATION NUMBER OF THE EXPORTERS)
          </td>
          <td class="col-colon">:-<br>:-<br>:-</td>
          <td class="col-details">
            ${iecNo}<br>
            ${branchCode}<br>
            ${binNo}
          </td>
        </tr>

        <tr>
          <td class="col-sr">3</td>
          <td class="col-particulars">NAME OF THE MANUFACTURER (IF DIFFERENCE FROM THE EXPORTER)</td>
          <td class="col-colon">:-</td>
          <td class="col-details">${manufacturerName}</td>
        </tr>

        <tr>
          <td class="col-sr">4</td>
          <td class="col-particulars">FACTORY ADDRESS</td>
          <td class="col-colon">:-</td>
          <td class="col-details">${factoryAddress}</td>
        </tr>

        <tr>
          <td class="col-sr">5</td>
          <td class="col-particulars">DATE OF EXAMINATION</td>
          <td class="col-colon">:-</td>
          <td class="col-details">${examinationDate}</td>
        </tr>

        <tr>
          <td class="col-sr">6</td>
          <td class="col-particulars">NAME & DESIGNATION OF THE EXAMINING OFFICER INSPECTOR</td>
          <td class="col-colon">:-</td>
          <td class="col-details">${examiningOfficer}</td>
        </tr>

        <tr>
          <td class="col-sr">7</td>
          <td class="col-particulars">NAME & DESIGNATION OF THE SUPERVISION OFFICER SUPERINTENDENT.</td>
          <td class="col-colon">:-</td>
          <td class="col-details">${supervisingOfficer}</td>
        </tr>

        <tr>
          <td class="col-sr">8</td>
          <td class="col-particulars">
            a) NAME OF THE COMMISSIONERATE /DIVISION/RANGE<br>
            b) LOCATION CODE
          </td>
          <td class="col-colon">:-<br>:-</td>
          <td class="col-details">
            ${cName}/${dName}/${rName}<br>
            ${cCode} ${dCode} ${rCode}
          </td>
        </tr>

        <tr>
          <td class="col-sr">9</td>
          <td class="col-particulars">
            PARTICULARS OF EXPORT INVOICE<br>
            a) EXPORT INVOICE NO.<br>
            b) TOTAL NO. OF PACKAGES<br>
            c) NAME AND ADDRESS OF THE CONSIGNEE ABROAD
          </td>
          <td class="col-colon"><br>:-<br>:-<br>:-</td>
          <td class="col-details">
            <br>
            <div style="display: flex; justify-content: space-between; padding-right: 20px;">
              <span>${invoiceNumber}</span>
              <span>${invoiceDate}</span>
            </div>
            <div>${totalPackages} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; PKGS</div>
            ${consignee}
          </td>
        </tr>

        <tr>
          <td class="col-sr">10</td>
          <td class="col-particulars">
            a) IS THE DESCRITION OF THE GOODS, THE TO PORT OF EXPORT?<br>
            C) IF YES, THE NUMBER OF THE SEAL OF THE PACKAGES CONTAINING THE SAMPLE
          </td>
          <td class="col-colon">:-<br><br>:-</td>
          <td class="col-details">
            ${portOfDischarge}<br><br><br>
          </td>
        </tr>

        <tr>
          <td class="col-sr">11</td>
          <td class="col-particulars">
            CENTRAL EXCISE PLYER PUNCH SEAL NO.<br>
            a) FOR NON-CONTAINER CARGO NO.OF PACKAGES<br>
            b) FOR CONTAINERAISED CARGO
          </td>
          <td class="col-colon">:-<br><br>:-</td>
          <td class="col-details">
            ${exciseSealNo}<br><br>
            ${cargoType}
          </td>
        </tr>

        <tr>
          <td class="col-sr">12</td>
          <td class="col-particulars">PERMISSION NO.</td>
          <td class="col-colon">:-</td>
          <td class="col-details">${permissionNo}</td>
        </tr>

        <tr>
          <td class="col-sr">13</td>
          <td class="col-particulars">AVAILING INPUT TAX CREDIT OF THE CENTRAL GOODS AND SERVICE TAX</td>
          <td class="col-colon">:-</td>
          <td class="col-details">${availingITC}</td>
        </tr>

        <tr>
          <td class="col-sr" style="border-bottom: none;">14</td>
          <td class="col-particulars" style="border-bottom: none;"><strong>AEO No :-</strong></td>
          <td class="col-colon" style="border-bottom: none;">:-</td>
          <td class="col-details" style="border-bottom: none;"><strong>${aeoNo}</strong></td>
        </tr>
      </tbody>
    </table>

    <!-- Container Details Table -->
    <table class="grid-table" style="border-left: none; border-right: none; border-top: 1px solid #000000;">
      <thead>
        <tr>
          <th style="border-left: none;">CONTAINER NO.</th>
          <th>SIZE</th>
          <th>PACKAGES</th>
          <th>SEAL NO.</th>
          <th style="border-right: none;">ELECTRONICS SEAL NO</th>
        </tr>
      </thead>
      <tbody>
        ${containerRowsHtml}
      </tbody>
    </table>

    <table style="width: 100%; border-collapse: collapse; border-top: 1px solid #000000; border-bottom: 1px solid #000000;">
      <tr>
        <td style="width: 5%; border-right: 1px solid #000000; padding: 3px 5px; font-size: 9.5pt; text-align: center; font-weight: bold;">14</td>
        <td style="padding: 3px 5px; font-size: 9.5pt; text-align: center; font-weight: bold;" colspan="4">GOODS PURCHASE BILL DETAILS</td>
      </tr>
    </table>

    <!-- Goods Purchase Table -->
    <table class="grid-table" style="border-left: none; border-right: none; border-top: none;">
      <thead>
        <tr>
          <th style="border-left: none; border-right: none; width: 20%;">MFG. BILL NO.</th>
          <th style="border-left: none; border-right: none; width: 20%;">DATE</th>
          <th style="border-left: none; border-right: none; width: 35%;">COMPANY NAME.</th>
          <th style="border-left: none; border-right: none; width: 25%;">MFG GST NO.</th>
        </tr>
      </thead>
      <tbody>
        ${goodsPurchaseRowsHtml}
      </tbody>
    </table>

    <!-- Bottom Signatures -->
    <div class="signature-section">
      <div style="margin-left: 20px; font-weight: bold; margin-bottom: 5px;">
        SIGNATURE OF THE EXPORTER
      </div>

      <!-- Signature Image / Stamp Dynamic Area -->
      <div style="margin-left: 20px; min-height: 45px;">
        ${signatureBase64 ? `<img src="${signatureBase64}" style="max-height: 45px;" alt="Signature" />` : `
          <div style="color: #0000aa; font-family: Arial, sans-serif; font-weight: bold; font-size: 11pt;">
            ${companyName}<br>
            <span style="font-size: 10pt; text-decoration: underline;">K. v. Patel</span><br>
            <span style="font-size: 9pt; color: #000; font-family: 'Times New Roman';">Partner</span>
          </div>
        `}
      </div>

      <br>

      <div style="line-height: 1.3; font-size: 9.5pt;">
        <strong>NAME :</strong> ${companyName}<br>
        <strong>DESIGNATION :-</strong> AUTHORISED SIGNATURY
      </div>
    </div>

  </div>

</body>
</html>`;

  return html;
}

module.exports = {
  renderAnnexureHtml,
  escapeHtml
};
