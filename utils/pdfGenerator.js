const puppeteer = require('puppeteer');
const { generateInrInvoicePdf } = require('../services/pdfService');
const { renderVgmHtml } = require('../templates/vgmTemplate');

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

  // Pure 6-column data mapping
  const productRows = products
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

  // Dummy fallback data
  const dummyProductRows = `
    <tr class="align-center"><td>528</td><td style="text-align: left; font-weight:bold;">ITALIAN SETS TRAP WHITE</td><td>264</td><td>SET</td><td>10880.00</td><td>10932.00</td></tr>
    <tr class="align-center"><td>160</td><td style="text-align: left; font-weight:bold;">ITALIAN SETS TRAP COLOR</td><td>80</td><td>SET</td><td>3600.00</td><td>3616.00</td></tr>
    <tr class="align-center"><td>500</td><td style="text-align: left; font-weight:bold;">20X16 WASH BASIN</td><td>500</td><td>PCS</td><td>7500.00</td><td>7600.00</td></tr>
    <tr class="align-center"><td>156</td><td style="text-align: left; font-weight:bold;">22X16 REPOSE SET-WHITE</td><td>78</td><td>SET</td><td>1560.00</td><td>1575.00</td></tr>
    <tr class="align-center"><td>160</td><td style="text-align: left; font-weight:bold;">22X16 REPOSE SET-COLOR</td><td>80</td><td>SET</td><td>1600.00</td><td>1616.00</td></tr>
        ${exporterData?.officeAddress ? `<strong>Office Address :</strong> ${exporterData.officeAddress}<br>` : ''}
        <strong>E-mail :</strong> ${exporterData?.email || "shreehariexporthouse@gmail.com, osissanitarywares@gmail.com"}<br>
        <strong>Web :</strong> ${exporterData?.website || "www.osissanitaryware.com"} &nbsp;&nbsp;&nbsp;&nbsp; <strong>Ph.:</strong> ${exporterData?.officeNumber || '+91 97140 15071'}
      </td>
    </tr>
  </table>

  <table class="master-table">
    <tr><td colspan="6" class="document-title">PACKING LIST</td></tr>
    
    <tr>
      <td colspan="3" style="width: 50%;">
        <span class="field-title">Exporter:-</span>
        <strong>${exporterData?.companyName || "SHREE HARI EXPORT HOUSE"}</strong><br>
        ${exporterData?.registeredAddress || exporterData?.officeAddress || exporterData?.companyAddress || "SHOP NO. 1, SECOND FLOOR, SURVEY NO. 95 P2<br>PLOT NO. 2, NEAR NILKANTH PARK SOCIETY,<br>MAHENDRANAGAR BUS STAND, MORBI HALVAD ROAD,<br>MAHENDRANAGAR, MORBI, GUJARAT, INDIA"}
      </td>
      <td colspan="3" style="width: 50%; padding: 0 !important; vertical-align: top;">
        <table style="width: 100%; border-collapse: collapse; margin: 0;">
          <tr>
            <td style="width: 50%; border-right: 1px solid #000; border-bottom: 1px solid #000; padding: 4px 6px; vertical-align: top;">
              <span class="field-title" style="margin-bottom: 4px;">Details :-</span>
              <strong>Invoice No :-</strong><br>${shipment?.invoiceNumber || shipment?.invoiceNo || "EXP 6"}
            </td>
            <td style="width: 50%; border-bottom: 1px solid #000; padding: 4px 6px; vertical-align: bottom;">
              <strong>Date :-</strong><br>${shipment?.invoiceDate ? new Date(shipment.invoiceDate).toLocaleDateString("en-GB").replace(/\//g, ".") : shipment?.date ? new Date(shipment.date).toLocaleDateString("en-GB").replace(/\//g, ".") : "14.04.2025"}
            </td>
          </tr>
          <tr>
            <td style="width: 50%; border-right: 1px solid #000; border-bottom: 1px solid #000; padding: 4px 6px; vertical-align: top;">
              <strong>IEC No :-</strong><br>${exporterData?.iecNo || "ADSFS7838P1ZX"}
            </td>
            <td style="width: 50%; border-bottom: 1px solid #000; padding: 4px 6px; vertical-align: top;">
              <strong>GST No :-</strong><br>${exporterData?.gstNo || "24ADSFS7838P1ZX"}
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 4px 6px; vertical-align: top;">
              <strong>BIN No :-</strong><br>${exporterData?.binNo || "ADSFS7838P1ZX FT 001"}
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td colspan="3">
        <span class="field-title">Consignee :-</span>
        <strong>${shipment?.consignee || exporterData?.consignee || "TO ORDER"}</strong>
      </td>
      <td colspan="3">
        <span class="field-title">Notify Buyer :-</span>
        <strong>${notifyParty?.companyName || notifyParty?.name || primaryBuyerDoc?.companyName || primaryBuyerDoc?.name || "JHOEL ALBERTH SALVADOR LIMA"}</strong><br>
        NIT:- ${notifyParty?.nitNumber || notifyParty?.nit || primaryBuyerDoc?.nitNumber || primaryBuyerDoc?.nit || "7021575018"}<br>
        ${notifyParty?.companyName || notifyParty?.name || primaryBuyerDoc?.companyName || primaryBuyerDoc?.name || "SMART GUARD"}<br>
        ${notifyParty?.address || primaryBuyerDoc?.address || shipment?.primaryBuyer?.address || "AV. SANTO TOMAS, NRO.1326, ZONA NUEVOS<br>HORIZONTES, ENTRE AV.LITORAL,<br>A UNA CUADRA DE LA PLAZA CORAZON DE JESUS."}<br>
        <div style="border-top: 1px solid #000; margin: 4px -6px -4px -6px; padding: 4px 6px;">
          <strong>SECOND NOTIFY :-</strong>
          ${secondNotifyParty?.companyName || secondNotifyParty?.name || ""}
          ${secondNotifyParty?.address ? `<br>${secondNotifyParty.address}` : ""}
        </div>
      </td>
    </tr>

    <tr>
      <td colspan="2"><strong>Port of Loading</strong><br>${shipment?.loadingPort?.portName || shipment?.loadingPort || "MUNDRA"}</td>
      <td colspan="2"><strong>Port of Discharge</strong><br>${effectiveDischargePort}</td>
      <td colspan="2"><strong>Payment Terms</strong><br>${shipment?.paymentTerms || shipment?.paymentTerm || "120 DAYS AGAINST BL"}</td>
    </tr>
    <tr>
      <td colspan="2"><strong>Country of Origin</strong><br>${shipment?.countryOfOrigin || "INDIA"}</td>
      <td colspan="2"><strong>Final Destination</strong><br>${shipment?.finalDestination || effectiveFinalDestination}</td>
      <td colspan="2"><strong>Export Terms</strong><br>${shipment?.exportTerms || "FOB"}</td>
    </tr>

    <tr class="product-table">
      <th style="width: 12%;">No & Kind of<br>Packages</th>
      <th style="width: 44%;">Description of Goods<br><span style="font-weight:normal; font-size: 8px;">CERAMIC SANITARY WARE</span></th>
      <th style="width: 10%;">Quantity</th>
      <th style="width: 8%;">SET/PCS</th>
      <th style="width: 13%;">Net Weight<br>in Kg</th>
      <th style="width: 13%;">Gross Weight<br>in Kg</th>
    </tr>
    
    ${renderProducts}

    <tr style="font-weight: bold; background-color: #fcfcfc;">
      <td class="align-center">TOTAL PCS<br>${finalTotalPkgs}</td>
      <td></td>
      <td colspan="2" class="align-center">TOTAL KG</td>
      <td class="align-center">${finalTotalNetWeight.toFixed(2)}</td>
      <td class="align-center">${finalTotalGrossWeight.toFixed(2)}</td>
    </tr>
    
    <tr>
      <td colspan="6" style="padding: 0 !important;">
        <table style="width: 100%; border-collapse: collapse; margin: 0;">
          <tr class="align-center" style="font-weight: bold; font-size: 9px; background: #fcfcfc;">
            <td style="border-right: 1px solid #000; border-bottom: 1px solid #000; padding: 4px 6px;">Container No.</td>
            <td style="border-right: 1px solid #000; border-bottom: 1px solid #000; padding: 4px 6px;">Line Seal No.</td>
            <td style="border-right: 1px solid #000; border-bottom: 1px solid #000; padding: 4px 6px;">Electronics Seal No.</td>
            <td style="border-bottom: 1px solid #000; padding: 4px 6px;">Container Quantity</td>
          </tr>
          <tr class="align-center">
            <td style="border-right: 1px solid #000; padding: 4px 6px;">${containers[0]?.containerNumber || "HLBU 1764245"}</td>
            <td style="border-right: 1px solid #000; padding: 4px 6px;">${containers[0]?.lineSealNumber || "HLK 2785464"}</td>
            <td style="border-right: 1px solid #000; padding: 4px 6px;">${containers[0]?.electronicsSealNumber || "WIND 02261339"}</td>
            <td style="padding: 4px 6px;">${containers[0]?.containerQuantity || "1X40 FT"}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <table style="width: 100%; margin-top: 5px;">
    <tr>
      <td style="width: 60%; vertical-align: top;">
        <div class="footer-declaration">
          WE INTEND TO CLAIM REWARDS UNDER REMISSION OF DUTIES AND TAXES ON EXPORTED PRODUCTS (RoDTEP) & DBK DECLARATION, IF ANY WE HEREBY DECLARE THAT SAME SHALL CLAIM THE BENEFIT AS ADMISSIBLE UNDER CHAPTER 3 OF FTP)<br><br>
          <strong>SUPPLY MEANT FOR EXPORT UNDER BOND WITHOUT PAYMENT OF INTEGRATED TAX [IGST]</strong><br>
          LUT NO :${exporterData?.lutNo || exporter?.lutNo || "AD2403250559720 24/03/2025"}<br>
          We availing Input tax Credit of The Central Goods and Service Tax<br>
          State of Origin GUJARAT AND DIST:- SURENDRANAGAR /NCPTI<br><br>
          <strong>Declaration:</strong><br>
          We declare that this Packing List shows the actual particulars of the goods described and that all the details are true and correct.
        </div>
      </td>
      <td style="width: 40%; text-align: right; vertical-align: bottom; padding-top: 30px;">
        <div style="font-weight:bold; font-size: 10px;">For, ${exporterData?.companyName || "SHREE HARI EXPORT HOUSE"}</div>
        <div style="color: #1a659e; font-family: monospace; font-weight: bold; font-size: 14px; margin-top: 20px; margin-right: 15px;">
          K.V. Patel<br><span style="font-size: 9px; color: #333; font-family: Arial;">Partner</span>
        </div>
        <div style="font-weight:bold; font-size: 9px; margin-top: 10px; border-top: 1px dashed #777; padding-top: 3px; display: inline-block; width: 180px; text-align: center;">
          AUTHORIZED SIGNATURE
        </div>
      </td>
    </tr>
  </table>

  <div class="flags-strip">
    <span>EUROPEAN UNION • KENYA • OMAN • SAUDI ARABIA • SRILANKA • UAE • YEMEN • ISRAEL • SURINAME • SERBIA • QATAR</span>
  </div>

  <tr>
<td>
${
  exporterData?.footerImage
    ? `<img src="http://localhost:5000${exporterData.footerImage}" style="max-width: 1000px; margin-top: 10px;" alt="Signature/Stamp" />`
    : `<div style="color: #1a659e; font-family: monospace; font-weight: bold; font-size: 14px; margin-top: 20px; margin-right: 15px;">
         K.V. Patel<br><span style="font-size: 9px; color: #333; font-family: Arial;">Partner</span>
       </div>`
}
  </td>
  </tr>

</body>
</html>
  `;

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--window-position=-32000,-32000",
    ],
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" },
  });

  await browser.close();
  return pdfBuffer;
};

// ---------------------------------------------------------
// 3. ANNEXURE PDF GENERATOR
// ---------------------------------------------------------
const generateAnnexurePDF = async (shipment, exporter) => {
  const containers = shipment?.containers || [];
  const products = shipment?.products || [];
  const manufacturerDetails = shipment?.manufacturerDetails || {};
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
  const effectiveDischargePort = shipment?.dischargePort?.portName || shipment?.dischargePort || shipment?.portOfDischarge || "IQUIQUE, CHILE";
  const effectiveFinalDestination = shipment?.finalDestination || effectiveDischargePort;
  const totalPackages = products.reduce(
    (sum, p) => sum + (Number(p.packagesCount) || 0),
    0,
  );

  const rangeData = shipment?.rangeDataId || {};
  const rName = rangeData.range ? rangeData.range.toUpperCase() : "CHOTILA";
  const rCode = rangeData.rangeCode || "04";
  const dName = rangeData.division
    ? rangeData.division.toUpperCase()
    : "SURENDRANAGAR";
  const dCode = rangeData.divisionCode || "05";
  const cName = rangeData.commissionerate
    ? rangeData.commissionerate.toUpperCase()
    : "BHAVNAGAR";
  const cCode = rangeData.commissionerateCode || "WW";

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 25px; color: #000; font-size: 10px; line-height: 1.2; box-sizing: border-box; }
        .company-header { width: 100%; margin-bottom: 8px; }
        .header-table { width: 100%; border-collapse: collapse; }
        .header-table td { border: none !important; padding: 0; vertical-align: middle; }
        .logo-text-main { font-size: 24px; font-weight: bold; color: #1a659e; font-style: italic; }
        .logo-text-sub { font-size: 14px; font-weight: bold; color: #333; display: block; margin-top: -3px; }
        .corporate-info { text-align: right; font-size: 8.5px; color: #222; line-height: 1.3; }
        .document-title { width: 100%; text-align: center; font-weight: bold; font-size: 11px; border: 1px solid #000; padding: 4px 0; background-color: #fcfcfc; text-transform: uppercase; margin-bottom: -1px; letter-spacing: 0.5px; }
        .document-subtitle { width: 100%; text-align: center; font-weight: bold; font-size: 9px; border: 1px solid #000; border-top: none; padding: 4px 0; background-color: #f7f7f7; text-transform: uppercase; margin-bottom: 8px; }
        .annex-grid { width: 100%; border-collapse: collapse; margin-top: 5px; margin-bottom: 10px; }
        .annex-grid th, .annex-grid td { border: 1px solid #000; padding: 6px 8px; font-size: 9.5px; vertical-align: top; }
        .annex-grid th { background-color: #f7f7f7; font-weight: bold; text-align: left; }
        .align-center { text-align: center; }
        .section-heading { font-weight: bold; font-size: 10px; background-color: #f4f4f4; padding: 4px 8px; border: 1px solid #000; margin-top: 10px; margin-bottom: -1px; text-transform: uppercase; }
        .sign-off-frame { width: 100%; border-collapse: collapse; margin-top: 20px; page-break-inside: avoid; }
        .sign-off-frame td { border: 1px solid #000; padding: 8px; vertical-align: top; }
        .flags-strip { width: 100%; text-align: center; border: 1px solid #000; padding: 6px 0; background: #fafafa; margin-top: 20px; }
        .flags-strip span { font-size: 7px; font-weight: bold; color: #555; text-transform: uppercase; letter-spacing: 0.5px; }
      </style>
    </head>
    <body>
      <div class="company-header">
        <table class="header-table">
          <tr>
            <td style="width: 40%;">
      ${
        exporterData?.logoImage
          ? `<img src="http://localhost:5000${exporterData.logoImage}" style="max-width: 250px; max-height: 80px;" alt="Logo" />`
          : `<div class="logo-main">${exporterData?.companyName?.split(" ")[0] || "Shree Hari"}</div>
           <div class="logo-sub">${exporterData?.companyName?.split(" ").slice(1).join(" ") || "Export House"}</div>`
      }    </td>
            <td class="corporate-info">
              <strong>Corporate Office :</strong><br>
              ${exporterData?.companyAddress || "201, Survey No.95 P2, Plot No.2, Near Nilkanth Park, Morbi-2, Gujarat, INDIA."}<br>
              ${exporterData?.officeAddress ? `<strong>Office Address :</strong> ${exporterData.officeAddress}<br>` : ''}
              <strong>E-mail :</strong> ${exporterData?.email || "shreehariexporthouse@gmail.com, osissanitarywares@gmail.com"}<br>
              <strong>Web :</strong> ${exporterData?.website || "www.osissanitaryware.com"} &nbsp;|&nbsp; <strong>Ph.:</strong> ${exporterData?.officeNumber || '+91 97140 15071'}
            </td>
          </tr>
        </table>
      </div>

      <div class="document-title">ANNEXURE</div>
      <div class="document-subtitle">OFFICE OF THE SUPERINTENDENT OF CGST <br> <span style="font-size: 8px; font-weight: normal;">RANGE: ${rName}, DIVISION: ${dName}, COMMISSIONERATE: ${cName}</span></div>

      <table class="annex-grid">
        <thead>
          <tr>
            <th style="width: 8%; text-align: center;">Sr No.</th>
            <th style="width: 42%;">Particulars / Details of Information</th>
            <th style="width: 50%;">Details / Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="align-center">1</td>
            <td><strong>NAME OF THE EXPORTER & ADDRESS</strong></td>
            <td>
              <strong>${exporterData?.companyName || "SHREE HARI EXPORT HOUSE"}</strong><br>
              ${exporterData?.registeredAddress || exporterData?.companyAddress || "SHOP NO. 1, SECOND FLOOR, SURVEY NO. 95 P2, PLOT NO. 2, NEAR NILKANTH PARK SOCIETY, MAHENDRANAGAR BUS STAND, MORBI HALVAD ROAD, MAHENDRANAGAR, MORBI, GUJARAT, INDIA"}
            </td>
          </tr>
          <tr>
            <td class="align-center">2</td>
            <td>
              a) <strong>IEC NO.</strong><br>
              b) <strong>BRANCH CODE (MORBI)</strong><br>
              c) <strong>BIN (PAN BASED ID NO.)</strong>
            </td>
            <td>
              ${exporterData?.iecNo || "ADSFS7838P1ZX"}<br>
              ${exporterData?.binNo || "ADSFS7838P1ZX FT 001"}<br>
              ${exporterData?.iecNo || "ADSFS7838P1ZX"}
            </td>
          </tr>
          <tr>
            <td class="align-center">3</td>
            <td><strong>NAME OF THE MANUFACTURER</strong><br><span style="font-size: 8px; color:#555;">(If different from exporter)</span></td>
            <td>${manufacturerDetails?.companyName || shipment?.manufacturer?.companyName || shipment?.manufacturer?.name || "DYNAMIC CERAMIC"}</td>
          </tr>
          <tr>
            <td class="align-center">4</td>
            <td><strong>FACTORY ADDRESS</strong></td>
            <td>${manufacturerDetails?.address || shipment?.manufacturer?.address || "ABHEPAR ROAD, THANGADH"}</td>
          </tr>
          <tr>
            <td class="align-center">5</td>
            <td><strong>DATE OF EXAMINATION</strong></td>
            <td>${shipment?.invoiceDate ? new Date(shipment.invoiceDate).toLocaleDateString("en-GB") : "14.04.2025"}</td>
          </tr>
          <tr>
            <td class="align-center">6 & 7</td>
            <td>
              <strong>NAME & DESIGNATION OF EXAMINING OFFICER</strong><br>
              <strong>NAME & DESIGNATION OF SUPERVISION OFFICER</strong>
            </td>
            <td>
              SELF SEALING (INSPECTOR)<br>
              SELF SEALING (SUPERINTENDENT)
            </td>
          </tr>
          <tr>
            <tr>
            <td class="align-center">8</td>
            <td>
              a) <strong>NAME OF COMMISSIONERATE/DIV/RANGE</strong><br>
              b) <strong>LOCATION CODE</strong>
            </td>
            <td>
              ${cName} / ${dName} / ${rName}<br>
              ${cCode} / ${dCode} / ${rCode}
            </td>
          </tr>
          </tr>
          <tr>
            <td class="align-center">9</td>
            <td>
              <strong>PARTICULARS OF EXPORT INVOICE</strong><br>
              a) EXPORT INVOICE NO. & DATE<br>
              b) TOTAL NO. OF PACKAGES
            </td>
            <td>
              <br>
              <strong>${shipment?.invoiceNumber || shipment?.invoiceNo || "EXP 6"}</strong> &nbsp;|&nbsp; ${shipment?.invoiceDate ? new Date(shipment.invoiceDate).toLocaleDateString("en-GB") : "14.04.2025"}<br>
              <strong>${totalPackages || totalPackagesCount || "1504"} PKGS</strong>
            </td>
          </tr>
          <tr>
            <td class="align-center">10</td>
            <td>
              c) <strong>NAME & ADDRESS OF CONSIGNEE ABROAD</strong><br>
              d) <strong>PORT OF EXPORT (DISCHARGE)</strong>
            </td>
            <td>
              <strong>${shipment?.consignee || exporterData?.consignee || "TO ORDER"}</strong><br>
              ${effectiveDischargePort}
            </td>
          </tr>
          <tr>
            <td class="align-center">11</td>
            <td>
              a) <strong>DESCRIPTION OF GOODS MATCHING WITH INV?</strong><br>
              b) <strong>CENTRAL EXCISE PLYER PUNCH SEAL NO.</strong>
            </td>
            <td>
              YES<br>
              SELF SEALING
            </td>
          </tr>
          <tr>
            <td class="align-center">12</td>
            <td><strong>SELF SEALING PERMISSION NO.</strong></td>
            <td>-1423 / CCP / JMR / 2018-19</td>
          </tr>
          <tr>
            <td class="align-center">13 & 14</td>
            <td>
              <strong>AVAILING INPUT TAX CREDIT OF CGST?</strong><br>
              <strong>AEO NO.</strong>
            </td>
            <td>
              YES<br>
              IN ADSFS7838P1F214
            </td>
          </tr>
        </tbody>
      </table>

      <div class="section-heading">Container Details</div>
      <table class="annex-grid">
        <thead>
          <tr style="background-color: #f7f7f7; text-align: center;">
            <th class="align-center">Container No.</th>
            <th class="align-center">Size</th>
            <th class="align-center">Packages</th>
            <th class="align-center">Seal No.</th>
            <th class="align-center">Electronics Seal No.</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="align-center"><strong>${containers[0]?.containerNumber || containers[0]?.containerNo || "HLBU 1764245"}</strong></td>
            <td class="align-center">${containers[0]?.containerSize || containers[0]?.size || "40'"}</td>
            <td class="align-center">${containers[0]?.packagesCount || containers[0]?.packages || totalPackages || "1504"}</td>
            <td class="align-center">${containers[0]?.lineSealNumber || containers[0]?.sealNumber || "HLK 2785464"}</td>
            <td class="align-center">${containers[0]?.electronicsSealNumber || containers[0]?.electronicSealNumber || "WIND 02261339"}</td>
          </tr>
        </tbody>
      </table>

      <div class="section-heading">Goods Purchase Bill Details</div>
      <table class="annex-grid">
        <thead>
          <tr style="background-color: #f7f7f7;">
            <th class="align-center" style="width: 20%;">Mfg. Bill No.</th>
            <th class="align-center" style="width: 20%;">Date</th>
            <th style="width: 35%;">Company Name</th>
            <th style="width: 25%;">Mfg. GST No.</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="align-center">${shipment?.billDetails?.billNumber || manufacturerDetails?.billNumber || "GT/11"}</td>
            <td class="align-center">${shipment?.billDetails?.billDate || manufacturerDetails?.billDate || "13.04.2025"}</td>
            <td>${shipment?.billDetails?.companyName || manufacturerDetails?.companyName || "VISHWAS CERAMIC"}</td>
            <td>${shipment?.billDetails?.gstNo || manufacturerDetails?.gstNo || "24AAHFV7084N1ZH"}</td>
          </tr>
          <tr>
            <td class="align-center">${shipment?.billDetails?.alternateBillNumber || manufacturerDetails?.alternateBillNumber || "63"}</td>
            <td class="align-center">${shipment?.billDetails?.alternateBillDate || manufacturerDetails?.alternateBillDate || "13.04.2025"}</td>
            <td>${shipment?.billDetails?.alternateCompanyName || manufacturerDetails?.alternateCompanyName || "FLOWTECH POLYMERS"}</td>
            <td>${shipment?.billDetails?.alternateGstNo || manufacturerDetails?.alternateGstNo || "24AAFFF5015P1ZC"}</td>
          </tr>
        </tbody>
      </table>

      <table class="sign-off-frame">
        <tr>
          <td style="width: 55%; border: none; font-size: 9px; padding-top: 20px;">
            <strong>NAME:</strong> ${shipment?.signatoryName || exporterData?.authorizedSignatory || "KISHORBHAI"} (${exporterData?.companyName || "SHREE HARI EXPORT HOUSE"})<br>
            <strong>DESIGNATION:</strong> ${shipment?.signatoryDesignation || exporterData?.designation || "Authorised Signatory"}<br>
            <strong>PLACE:</strong> ${shipment?.signatoryPlace || exporterData?.place || "MORBI, GUJARAT"}
          </td>
          <td style="width: 45%; text-align: right; border: none; height: 70px; position: relative;">
            <div style="font-weight:bold; font-size: 9.5px;">For, ${exporterData?.companyName || "SHREE HARI EXPORT HOUSE"}</div>
            <div style="color: #1a659e; font-family: monospace; font-weight: bold; font-size: 13px; margin-top: 12px; margin-right: 15px;">
              K.V. Patel<br><span style="font-size: 9px; color: #333; font-family: Arial;">Partner</span>
            </div>
            <div style="font-weight:bold; font-size: 9px; margin-top: 8px; border-top: 1px dashed #777; padding-top: 3px; display: inline-block; width: 180px; text-align: center;">
              SIGNATURE OF THE EXPORTER
            </div>
          </td>
        </tr>
      </table>

      <div class="flags-strip">
        <span>EUROPEAN UNION • KENYA • OMAN • SAUDI ARABIA • SRILANKA • UAE • YEMEN • ISRAEL • SURINAME • SERBIA • QATAR</span>
      </div>

      <tr>
<td>
${
  exporterData?.footerImage
    ? `<img src="http://localhost:5000${exporterData.footerImage}" style="max-width: 1000px; margin-top: 10px;" alt="Signature/Stamp" />`
    : `<div style="color: #1a659e; font-family: monospace; font-weight: bold; font-size: 14px; margin-top: 20px; margin-right: 15px;">
         K.V. Patel<br><span style="font-size: 9px; color: #333; font-family: Arial;">Partner</span>
       </div>`
}
  </td>
  </tr>

    </body>
    </html>
  `;

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "0mm", bottom: "0mm", left: "0mm", right: "0mm" },
  });

  await browser.close();
  return pdfBuffer;
};

// ---------------------------------------------------------
// 4. VGM PDF GENERATOR
// ---------------------------------------------------------
const generateVGMPDF = async (shipment, exporter) => {
  try {
    const renderPayload = {
      ...(shipment ? (typeof shipment.toObject === 'function' ? shipment.toObject() : shipment) : {}),
      exporter: exporter || {}
    };

    const htmlContent = renderVgmHtml(renderPayload);

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--window-position=-32000,-32000"],
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0mm", bottom: "0mm", left: "0mm", right: "0mm" },
    });

    await browser.close();
    return pdfBuffer;
  } catch (err) {
    console.error("🔥 Error in generateVGMPDF:", err);
    throw err;
  }
};

// ---------------------------------------------------------
// 5. QUOTATION PDF GENERATOR
// ---------------------------------------------------------
const generateQuotationPDF = async (shipment) => {
  /* Legacy/Placeholder */
};

module.exports = {
  generateInvoicePDF,
  generatePackagingListPDF,
  generateVGMPDF,
  generateQuotationPDF,
  generateAnnexurePDF,
};
