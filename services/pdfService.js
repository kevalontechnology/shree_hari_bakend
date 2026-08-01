const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

async function generatePdfFromHtml(htmlContent) {
  try {
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
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    
    await browser.close();
    return pdfBuffer;
  } catch (error) {
    console.error("Puppeteer Launch Error in pdfService:", error);
    throw error;
  }
}

module.exports = { generatePdfFromHtml };