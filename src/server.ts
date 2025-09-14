const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');
const { scrapeAllSources } = require('./scraper');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// API endpoints
app.get('/api/hackathons', (req: any, res: any) => {
  const { location, date, source, limit = 50 } = req.query;
  let query = 'SELECT * FROM hackathons WHERE 1=1';
  const params: any[] = [];

  if (location) {
    query += ' AND location LIKE ?';
    params.push(`%${location}%`);
  }
  if (date) {
    query += ' AND date LIKE ?';
    params.push(`%${date}%`);
  }
  if (source) {
    query += ' AND source = ?';
    params.push(source);
  }

  query += ' ORDER BY id DESC LIMIT ?';
  params.push(parseInt(limit as string));

  db.all(query, params, (err: any, rows: any) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

app.get('/api/companies', (req: any, res: any) => {
  const { industry, location, yc_backed, source, limit = 50 } = req.query;
  let query = 'SELECT * FROM companies WHERE 1=1';
  const params: any[] = [];

  if (industry) {
    query += ' AND industry LIKE ?';
    params.push(`%${industry}%`);
  }
  if (location) {
    query += ' AND location LIKE ?';
    params.push(`%${location}%`);
  }
  if (yc_backed !== undefined) {
    query += ' AND yc_backed = ?';
    params.push(yc_backed === 'true' ? 1 : 0);
  }
  if (source) {
    query += ' AND source = ?';
    params.push(source);
  }

  query += ' ORDER BY id DESC LIMIT ?';
  params.push(parseInt(limit as string));

  db.all(query, params, (err: any, rows: any) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

app.post('/api/scrape', async (req: any, res: any) => {
  const { location, date, industry } = req.body;
  try {
    console.log('Starting scrape...');
    const result = await scrapeAllSources({ location, date, industry });
    res.json({ message: 'Scraping completed', count: result.hackathons.length + result.companies.length });
  } catch (error) {
    res.status(500).json({ error: 'Scraping failed', details: (error as Error).message });
  }
});

// Serve the main HTML page
app.get('/', (req: any, res: any) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
