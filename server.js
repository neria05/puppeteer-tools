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
        '--font-render-hinting=none' // לשיפור חדות הטקסט
      ],
    });

    const page = await browser.newPage();

    // הגדרת רזולוציה אופטימלית לקופון
    await page.setViewport({
      width: 500, // רוחב הקופון שהגדרנו ב-HTML
      height: 800, // גובה התחלתי, יתעדכן אוטומטית
      deviceScaleFactor: 2, // רזולוציה כפולה לתצוגה חדה
      isMobile: false,
    });

    // הגדרת פונטים ורנדור איכותי
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

    // חכה שהקונטיינר של הקופון יטען
    await page.waitForSelector('.container');

    // קבל את המידות המדויקות של הקופון
    const element = await page.$('.container');
    const boundingBox = await element.boundingBox();

    // צילום מסך רק של אזור הקופון
    const screenshot = await element.screenshot({
      type: 'png',
      omitBackground: true, // רקע שקוף
      encoding: 'binary',
      quality: 100,
      optimizeForSpeed: false, // איכות מקסימלית
      clip: {
        x: boundingBox.x,
        y: boundingBox.y,
        width: boundingBox.width,
        height: boundingBox.height
      }
    });

    await browser.close();

    // הגדרת headers לתמונה איכותית
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
    });
  }
});

// תוספת של endpoint לבדיקת תקינות השרת
app.get('/health', (req, res) => {
  res.status(200).send({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Screenshot server running on http://localhost:${PORT}`);
});