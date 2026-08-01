const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

async function generatePdfFromHtml(htmlContent) {
  try {
    // Safe check to handle different versions of @sparticuz/chromium
    const execPath = typeof chromium.executablePath === 'function' 
      ? await chromium.executablePath() 
      : await chromium.executablePath;

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: execPath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    
    // Load the HTML content
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // Generate the PDF buffer
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' }
    });

    await browser.close();
    return pdfBuffer;
    
  } catch (error) {
    console.error("❌ Puppeteer Launch Error in pdfService:", error);
    throw error;
  }
}

module.exports = {
  generatePdfFromHtml
};