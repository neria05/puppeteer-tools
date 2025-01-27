const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000; // שנה אם צריך

// Middleware לקריאת גוף הבקשה
app.use(bodyParser.json({ limit: '10mb' })); // תמיכה ב-HTML ארוך

// נקודת קצה ליצירת תמונה
app.post('/generate-image', async (req, res) => {
  const { html } = req.body;

  if (!html) {
    return res.status(400).send('Error: HTML content is required');
  }

  try {
    const browser = await puppeteer.launch({
      headless: true, // הרצה ללא GUI
      args: ['--no-sandbox', '--disable-setuid-sandbox'], // תמיכה בקונטיינרים
    });
    const page = await browser.newPage();

    // טען HTML
    await page.setContent(html, { waitUntil: 'domcontentloaded' });

    // צלם מסך
    const screenshot = await page.screenshot({ type: 'png' });

    await browser.close();

    // שלח את התמונה בתגובה
    res.set('Content-Type', 'image/png');
    res.send(screenshot);
  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).send('Error generating image');
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
