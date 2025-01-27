const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const fs = require('fs');

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
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: 'domcontentloaded' });

    // צלם מסך
    const screenshot = await page.screenshot({ type: 'png', fullPage: true });

    await browser.close();

    // שמור את התמונה לבדיקה (אופציונלי)
    fs.writeFileSync('screenshot.png', screenshot);

    // החזר את התמונה בתגובה
    res.set('Content-Type', 'image/png');
    res.send(screenshot);
  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).send({ error: 'Error generating image', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
