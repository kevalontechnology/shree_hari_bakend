const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

async function generatePdfFromHtml(htmlContent) {
  let browser = null;
  try {
    // Force graphics headless mode for Linux server compatibility
    chromium.setHeadlessMode = true;
    chromium.setGraphicsMode = false;

    // THE FIX I ACCIDENTALLY REMOVED: Safely get the Chromium path
    const execPath = typeof chromium.executablePath === 'function' 
      ? await chromium.executablePath() 
      : await chromium.executablePath;

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: execPath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    
    // Use domcontentloaded to prevent freezing on dead external links/images
    await page.setContent(htmlContent, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' }
    });

    return pdfBuffer;
  } catch (error) {
    console.error("❌ Puppeteer Launch Error in pdfService:", error);
    throw error;
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
}

module.exports = {
  generatePdfFromHtml
};