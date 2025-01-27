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
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // הגדרת רזולוציה מותאמת לקופון (לדוגמה, A4 בגודל DPI גבוה)
    const width = 1200; // רוחב הקופון בפיקסלים
    const height = 2000; // גובה הקופון בפיקסלים
    await page.setViewport({
      width,
      height,
      deviceScaleFactor: 2, // DPI גבוה לתמונה חדה
    });

    // ניהול שגיאות בקונסול הדף
    page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));

    if (html) {
      // טעינת תוכן HTML
      await page.setContent(html, { waitUntil: 'networkidle0' });
    } else if (url) {
      // טעינת כתובת URL
      await page.goto(url, { waitUntil: 'networkidle0' });
    }

    // בדיקת תוכן הדף (לא חובה, אך עוזר לדיבאגינג)
    const content = await page.content();
    console.log('Page Content Loaded:', content);

    // צילום מסך של הדף
    const screenshot = await page.screenshot({ type: 'png', fullPage: true });

    await browser.close();

    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': 'inline; filename="coupon.png"',
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
