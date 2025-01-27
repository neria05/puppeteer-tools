const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// הגדר מגבלת גודל גוף הבקשה
app.use(bodyParser.json({ limit: '10mb' }));

app.post('/generate-image', async (req, res) => {
  const { html } = req.body;

  if (!html) {
    return res.status(400).send({ error: 'HTML content is required' });
  }

  try {
    // הפעלת Puppeteer עם הגדרות למניעת בעיות
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    });

    const page = await browser.newPage();

    // הגדרת התוכן של הדף
    await page.setContent(html, { waitUntil: 'domcontentloaded' });

    // צילום מסך בפורמט PNG
    const screenshot = await page.screenshot({ type: 'png', fullPage: true });

    // סגירת הדפדפן
    await browser.close();

    // הגדרת סוג התוכן בתגובה
    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': 'inline; filename="screenshot.png"',
    });

    // שליחת התמונה כתגובה
    res.end(screenshot, 'binary');
  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).send({
      error: 'Error generating image',
      details: error.message,
    });
  }
});

// הפעלת השרת
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
