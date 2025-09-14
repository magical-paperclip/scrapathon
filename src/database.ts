const sqlite3 = require('sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../data/scrapathon.db');

export const db = new sqlite3.Database(dbPath, (err: any) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Create tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS hackathons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      link TEXT,
      sponsors TEXT, -- JSON string
      contacts TEXT, -- JSON string
      yc_backed BOOLEAN DEFAULT 0,
      funding_interest TEXT, -- JSON string
      location TEXT,
      date TEXT,
      source TEXT,
      description TEXT,
      prizes TEXT, -- JSON string
      participants INTEGER,
      UNIQUE(name, source, link) ON CONFLICT REPLACE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      link TEXT,
      yc_backed BOOLEAN DEFAULT 0,
      funding_interest TEXT, -- JSON string
      industry TEXT,
      location TEXT,
      source TEXT,
      description TEXT,
      funding_stage TEXT,
      employees TEXT,
      UNIQUE(name, source, link) ON CONFLICT REPLACE
    )
  `);
});

export default db;
