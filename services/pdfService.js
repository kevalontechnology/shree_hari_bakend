const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const fs = require('fs');

async function generatePdfFromHtml(htmlContent) {
  let browser = null;
  try {
    // Force graphics headless mode for Linux server compatibility
    chromium.setHeadlessMode = true;
    chromium.setGraphicsMode = false;

    // Safely get the Chromium path
    let execPath = typeof chromium.executablePath === 'function' 
       ? await chromium.executablePath() 
       : await chromium.executablePath;

    // 🔥 FIX FOR LOCAL WINDOWS ENVIRONMENT 🔥
    // If running locally on Windows, use the installed Chrome or Edge
    if (process.platform === 'win32') {
      const winPaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
      ];
      for (let p of winPaths) {
        if (fs.existsSync(p)) {
          execPath = p;
          break;
        }
      }
    }

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: execPath,
      headless: true, // Ensured headless mode is true
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
    console.error("  Puppeteer Launch Error in pdfService:", error);
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