const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function renderPdfScreenshots() {
  console.log('Rendering screenshots of reference PDF and generated PDF...');
  const browser = await puppeteer.launch({ headless: true });

  // 1. Screenshot of EXP 6 INR.pdf
  const page1 = await browser.newPage();
  await page1.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
  const refPath = 'file:///' + path.join(__dirname, 'EXP 6 INR.pdf').replace(/\\/g, '/');
  await page1.goto(refPath, { waitUntil: 'networkidle0' });
  await page1.screenshot({ path: 'ref-invoice.png', fullPage: true });
  console.log('Saved ref-invoice.png');

  // 2. Screenshot of generated HTML
  const { renderInrInvoiceHtml } = require('./templates/inrInvoiceTemplate');
  const sampleData = {
    exporterDetails: {
      companyName: 'SHREE HARI EXPORT HOUSE',
      companyAddress: 'SHOP NO. 1, SECOND FLOOR, SURVEY NO. 95 P2\nPLOT NO. 2, NEAR NILKANTH PARK SOCIETY,\nMAHENDRANAGAR BUS STAND, MORBI HALVAD ROAD,\nMAHENDRANAGAR,MORBI, GUJARAT, INDIA',
      officeAddress: '201, Survey No.95 P2, Plot No.2, Near Nilkanth Park, Morbi-2, Gujarat, INDIA.',
      officeNumber: '+91 97140 15071',
      website: 'www.osissanitaryware.com',
      consignee: 'TO ORDER',
      iecNo: 'ADSFS7838P1ZX',
      gstNo: '24ADSFS7838P1ZX',
      binNo: 'ADSFS7838P1ZX FT 001'
    }
  };
  const html = renderInrInvoiceHtml(sampleData);
  const page2 = await browser.newPage();
  await page2.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
  await page2.setContent(html, { waitUntil: 'networkidle0' });
  await page2.screenshot({ path: 'generated-invoice.png', fullPage: true });
  console.log('Saved generated-invoice.png');

  await browser.close();
}

renderPdfScreenshots().catch(err => console.error('Screenshot Error:', err));
