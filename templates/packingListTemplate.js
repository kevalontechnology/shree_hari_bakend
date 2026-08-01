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

function renderPackingListHtml(data = {}) {
  const exporterDetails = data.exporterDetails || {};
  const exporter = data.exporter || {};

  const companyName = escapeHtml(exporterDetails.companyName || exporter.companyName || 'SHREE HARI EXPORT HOUSE');
  const companyAddress = escapeHtml(exporterDetails.companyAddress || exporter.companyAddress || 'SHOP NO. 1, SECOND FLOOR, SURVEY NO. 95 P2\nPLOT NO. 2, NEAR NILKANTH PARK SOCIETY,\nMAHENDRANAGAR BUS STAND, MORBI HALVAD ROAD,\nMAHENDRANAGAR,MORBI, GUJARAT, INDIA');
  const officeAddress = escapeHtml(exporterDetails.officeAddress || exporter.officeAddress || '201, Survey No.95 P2, Plot No.2, Near Nilkanth Park, Morbi-2, Gujarat, INDIA.');
  const officeNumber = escapeHtml(exporterDetails.officeNumber || exporter.officeNumber || '+91 97140 15071');
  const website = escapeHtml(exporterDetails.website || exporter.website || 'www.osissanitaryware.com');
  const consignee = escapeHtml(exporterDetails.consignee || data.consignee || 'TO ORDER');
  const iecNo = escapeHtml(exporterDetails.iecNo || exporterDetails.iecNumber || exporter.iecNo || 'ADSFS7838P1ZX');
  const gstNo = escapeHtml(exporterDetails.gstNo || exporterDetails.gstNumber || exporter.gstNo || '24ADSFS7838P1ZX');
  const binNo = escapeHtml(exporterDetails.binNo || exporterDetails.binNumber || exporter.binNo || 'ADSFS7838P1ZX FT 001');

  const invoiceNumber = escapeHtml(data.invoiceNumber || 'EXP 6');
  const invoiceDate = escapeHtml(data.invoiceDate ? new Date(data.invoiceDate).toLocaleDateString('en-GB').replace(/\//g, '.') : '14.04.2025');
  const countryOfOrigin = escapeHtml(data.countryOfOrigin || 'INDIA');
  const paymentTerms = escapeHtml(data.paymentTerms || '120 DAYS AGINST BL');
  const exportTerms = escapeHtml(data.exportTerms || 'FOB');

  const buyer = data.primaryBuyerDetails || data.buyerDetails || data.primaryBuyer || {};
  const notifyName = escapeHtml(buyer.name || buyer.companyName || 'JHOEL ALBERTH SALVADOR LIMA');
  const notifyNit = escapeHtml(buyer.nitNumber || '7021575018');
  const notifyGuard = escapeHtml(buyer.guard || 'SMART GUARD');
  const notifyAddress = escapeHtml(buyer.address || 'AV. SANTO TOMAS,NRO.1326,ZONA NUEVOS\n\nA UNA CUADRA DE LA PLAZA CORAZON DE JESUS.');

  const portOfLoading = escapeHtml(data.loadingPortName || (data.loadingPort && data.loadingPort.portName) || 'MUNDRA');
  const portOfDischarge = escapeHtml(data.dischargePortName || (data.dischargePort && data.dischargePort.portName) || 'IQUIQE,CHILEO');
  const gatewayPort = escapeHtml(data.gatewayPortName || (data.gatewayPort && data.gatewayPort.portName) || '');

  const firstContainer = (data.containers && data.containers.length > 0) ? data.containers[0] : {};
  const containerNo = escapeHtml(firstContainer.containerNumber || 'HLBU 1764245');
  const lineSealNo = escapeHtml(firstContainer.lineSealNumber || 'HLK 2785464');
  const electronicSealNo = escapeHtml(firstContainer.electronicSealNumber || 'WIND 02261339');
  const containerQuantity = escapeHtml(firstContainer.containerQuantity || (data.containers && data.containers.length > 0 ? `${data.containers.length}X40 FT` : '1X40 FT'));

  const sampleProducts = [
    { quantityUnit: 'SET', productName: 'ITALIAN SET S TRAP WHITE', quantity: 264, netWeightKG: 10880, grossWeightKG: 10932 },
    { quantityUnit: 'SET', productName: 'ITALIAN SET S TRAP COLOR', quantity: 80, netWeightKG: 3600, grossWeightKG: 3616 },
    { quantityUnit: 'PCS', productName: '20X16 WASH BASIN', quantity: 500, netWeightKG: 7500, grossWeightKG: 7600 },
    { quantityUnit: 'SET', productName: '22X16 REPOSE SET-WHITE', quantity: 78, netWeightKG: 1560, grossWeightKG: 1575 },
    { quantityUnit: 'SET', productName: '22X16 REPOSE SET-COLOR', quantity: 80, netWeightKG: 1600, grossWeightKG: 1616 }
  ];

  const productList = (data.products && data.products.length > 0) ? data.products : sampleProducts;

  let totalPcs = 0;
  let totalNetWeightKG = 0;
  let totalGrossWeightKG = 0;

  const productRowsHtml = productList.map(p => {
    const qty = Number(p.quantity || 0);
    const unit = String(p.quantityUnit || 'PCS').toUpperCase();
    const isSet = unit.includes('SET');
    const packages = isSet ? qty * 2 : qty;
    
    const nWt = Number(p.netWeightKG || p.netWeight || 0);
    const gWt = Number(p.grossWeightKG || p.grossWeight || 0);

    totalPcs += packages;
    totalNetWeightKG += nWt;
    totalGrossWeightKG += gWt;

    return `<tr class="product-row">
      <td class="text-center">${packages}</td>
      <td class="text-left" style="padding-left: 2mm;">${escapeHtml(p.productName || 'CERAMIC SANITARY WARE')}</td>
      <td class="text-center">${qty}</td>
      <td class="text-center">${escapeHtml(p.quantityUnit || 'SET')}</td>
      <td class="text-center">${nWt > 0 ? nWt : ''}</td>
      <td class="text-center">${gWt > 0 ? gWt : ''}</td>
    </tr>`;
  }).join('');

  if (totalNetWeightKG === 0) totalNetWeightKG = 25140;
  if (totalGrossWeightKG === 0) totalGrossWeightKG = 25339;

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

  const logoPath = resolveImagePath(exporterDetails.logoImage || exporter.logoImage, 'logo.jpg');
  const signaturePath = resolveImagePath(exporterDetails.signatureImage || exporter.signatureImage, 'signature.jpg');
  const footerPath = resolveImagePath(exporterDetails.footerImage || exporter.footerImage, 'footer-strip.jpg');

  const logoBase64 = imageToBase64(logoPath);
  const signatureBase64 = imageToBase64(signaturePath);
  const footerBase64 = imageToBase64(footerPath);

  const templatePath = path.join(__dirname, 'packing-list-template.html');
  let html = fs.readFileSync(templatePath, 'utf8');

  html = html
    .replace('{{LOGO_SRC}}', logoBase64)
    .replace('{{SIGNATURE_SRC}}', signatureBase64)
    .replace('{{FOOTER_SRC}}', footerBase64);

  html = html
    .replace(/\{\{COMPANY_NAME\}\}/g, companyName)
    .replace(/\{\{COMPANY_ADDRESS\}\}/g, companyAddress)
    .replace(/\{\{OFFICE_ADDRESS\}\}/g, officeAddress)
    .replace(/\{\{OFFICE_NUMBER\}\}/g, officeNumber)
    .replace(/\{\{WEBSITE\}\}/g, website)
    .replace(/\{\{CONSIGNEE\}\}/g, consignee)
    .replace(/\{\{IEC_NUMBER\}\}/g, iecNo)
    .replace(/\{\{GST_NUMBER\}\}/g, gstNo)
    .replace(/\{\{BIN_NUMBER\}\}/g, binNo)
    .replace(/\{\{INVOICE_NUMBER\}\}/g, invoiceNumber)
    .replace(/\{\{INVOICE_DATE\}\}/g, invoiceDate)
    .replace(/\{\{COUNTRY_OF_ORIGIN\}\}/g, countryOfOrigin)
    .replace(/\{\{PAYMENT_TERMS\}\}/g, paymentTerms)
    .replace(/\{\{EXPORT_TERMS\}\}/g, exportTerms)
    .replace(/\{\{NOTIFY_BUYER_NAME\}\}/g, notifyName)
    .replace(/\{\{NOTIFY_BUYER_NIT\}\}/g, notifyNit)
    .replace(/\{\{NOTIFY_BUYER_GUARD\}\}/g, notifyGuard)
    .replace(/\{\{NOTIFY_BUYER_ADDRESS\}\}/g, notifyAddress)
    .replace(/\{\{PORT_OF_LOADING\}\}/g, portOfLoading)
    .replace(/\{\{PORT_OF_DISCHARGE\}\}/g, portOfDischarge)
    .replace(/\{\{GATEWAY_PORT\}\}/g, gatewayPort)
    .replace(/\{\{CONTAINER_NO\}\}/g, containerNo)
    .replace(/\{\{LINE_SEAL_NO\}\}/g, lineSealNo)
    .replace(/\{\{ELECTRONIC_SEAL_NO\}\}/g, electronicSealNo)
    .replace(/\{\{CONTAINER_QUANTITY\}\}/g, containerQuantity)
    .replace('{{PRODUCT_ROWS}}', productRowsHtml)
    .replace('{{TOTAL_PCS}}', totalPcs)
    .replace('{{TOTAL_NET_WEIGHT_KG}}', totalNetWeightKG)
    .replace('{{TOTAL_GROSS_WEIGHT_KG}}', totalGrossWeightKG);

  return html;
}

module.exports = {
  renderPackingListHtml,
  escapeHtml
};
