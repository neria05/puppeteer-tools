const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json({ limit: '10mb' }));

app.post('/generate-image', async (req, res) => {
  const { html, url } = req.body;
  
  if (!html && !url) {
    return res.status(400).send({ error: 'Either HTML content or a URL is required' });
  }

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--font-render-hinting=none'
      ],
    });

    const page = await browser.newPage();
    
    // Set initial viewport size
    await page.setViewport({
      width: 540, // Slightly larger than container width to account for margins
      height: 1000, // Initial height, will be adjusted
      deviceScaleFactor: 2,
      isMobile: false,
    });

    // Add font smoothing
    await page.evaluateOnNewDocument(() => {
      document.body.style.webkitFontSmoothing = 'antialiased';
      document.body.style.mozOsxFontSmoothing = 'grayscale';
    });

    if (html) {
      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });
    } else if (url) {
      await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });
    }

    // Wait for container and get its dimensions
    await page.waitForSelector('.container');
    
    // Get the actual dimensions of the content
    const dimensions = await page.evaluate(() => {
      const container = document.querySelector('.container');
      const rect = container.getBoundingClientRect();
      return {
        width: Math.ceil(rect.width),
        height: Math.ceil(rect.height)
      };
    });

    // Reset viewport with actual content dimensions plus padding
    await page.setViewport({
      width: dimensions.width + 40, // Add 20px padding on each side
      height: dimensions.height + 40, // Add 20px padding on each side
      deviceScaleFactor: 2,
      isMobile: false,
    });

    // Take the screenshot of the entire page
    const screenshot = await page.screenshot({
      type: 'png',
      omitBackground: true,
      encoding: 'binary'
    });

    await browser.close();

    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': 'inline; filename="coupon.png"',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    });
    
    res.end(screenshot, 'binary');

  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).send({
      error: 'Error generating image',
      details: error.message,
      stack: error.stack
    });
  }
});

app.get('/health', (req, res) => {
  res.status(200).send({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Screenshot server running on http://localhost:${PORT}`);
});