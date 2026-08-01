const puppeteer = require('puppeteer');
const { renderInrInvoiceHtml } = require('../templates/inrInvoiceTemplate');

/**
 * Generate PDF buffer from HTML string using Puppeteer with exact A4 print settings
 * @param {string} html 
 * @returns {Promise<Buffer>}
 */
async function generatePdfFromHtml(html) {
  let browser = null;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-position=-32000,-32000'
      ]
    });

    const page = await browser.newPage();

    await page.setViewport({
      width: 794,
      height: 1123,
      deviceScaleFactor: 1
    });

    await page.setContent(html, {
      waitUntil: 'networkidle0'
    });

    await page.evaluate(async () => {
      if (document.fonts) {
        await document.fonts.ready;
      }
      const images = Array.from(document.images);
      await Promise.all(
        images.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      );
    });

    await page.emulateMediaType('print');

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      margin: {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0'
      },
      scale: 1
    });

    return pdfBuffer;
  } catch (error) {
    console.error('🔥 Error generating PDF with Puppeteer:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Generate INR Invoice PDF buffer directly from shipment/exporter data
 * @param {Object} data 
 * @returns {Promise<Buffer>}
 */
async function generateInrInvoicePdf(data) {
  const html = renderInrInvoiceHtml(data);
  return await generatePdfFromHtml(html);
}

module.exports = {
  generatePdfFromHtml,
  generateInrInvoicePdf
};
