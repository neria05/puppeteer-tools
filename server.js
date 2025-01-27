const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json({ limit: '10mb' }));

app.post('/generate-image', async (req, res) => {
  const { html } = req.body;

  if (!html) {
    return res.status(400).send({ error: 'HTML content is required' });
  }

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // הגדרת גודל התצוגה
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    });

    // ניהול שגיאות בקונסול הדף
    page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));

    // טעינת התוכן עם המתנה למשאבים
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // בדיקת בעיות בקוד
    const content = await page.content();
    console.log('Page Content Loaded:', content);

    // צילום מסך של הדף
    const screenshot = await page.screenshot({ type: 'png', fullPage: true });

    await browser.close();

    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': 'inline; filename="screenshot.png"',
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
