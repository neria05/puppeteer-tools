const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000; // Railway יגדיר את ה-PORT אוטומטית

// Middleware לקריאת גוף הבקשה
app.use(bodyParser.json({ limit: '10mb' }));

// נקודת קצה ליצירת תמונה מ-HTML
app.post('/generate-image', async (req, res) => {
  const { html } = req.body;

  if (!html) {
    return res.status(400).send('Error: HTML content is required');
  }

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'], // תמיכה בסביבות מוגבלות כמו Railway
    });

    const page = await browser.newPage();

    // טען את ה-HTML שנשלח בבקשה
    await page.setContent(html, { waitUntil: 'domcontentloaded' });

    // צלם מסך ושמור כתמונה
    const screenshot = await page.screenshot({ type: 'png' });

    await browser.close();

    // החזר את התמונה בתגובה
    res.set('Content-Type', 'image/png');
    res.send(screenshot);
  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).send('Error generating image');
  }
});

// הפעל את השרת
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
