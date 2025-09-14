# Hackathon Scraper

A comprehensive web scraper for hackathon sponsors, contacts, and funding companies with a built-in database and web interface for data science analysis.

## Features

- **Multi-source scraping**: Devpost, Hack Club, Y Combinator, Crunchbase, AngelList, Product Hunt
- **Advanced filters**: By location, date, industry, source
- **Database storage**: SQLite database for persistent storage
- **Web interface**: Interactive dashboard for browsing and filtering data
- **Export options**: CSV and JSON exports for data science
- **Concurrent scraping**: Fast parallel processing

## Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Build the project: `npm run build`

## Usage

### Web Interface
1. Start the server: `npm start`
2. Open http://localhost:3000 in your browser
3. Use filters to search hackathons and companies
4. Click "Start New Scrape" to refresh data

### API Endpoints

- `GET /api/hackathons` - Get hackathons with optional filters
- `GET /api/companies` - Get companies with optional filters
- `POST /api/scrape` - Trigger a new scrape

### Command Line Scraping

```bash
npm run scrape
```

## Data Science Usage

The scraper saves data in multiple formats:

1. **SQLite Database**: `data/scrapathon.db` - Query with SQL
2. **CSV Files**: `scrapathon_hackathons.csv`, `scrapathon_companies.csv`
3. **JSON File**: `scrapathon.json`

Use these files in Python, R, or other data science tools:

```python
import pandas as pd
import sqlite3

# From CSV
hackathons_df = pd.read_csv('scrapathon_hackathons.csv')
companies_df = pd.read_csv('scrapathon_companies.csv')

# From SQLite
conn = sqlite3.connect('data/scrapathon.db')
hackathons_df = pd.read_sql_query("SELECT * FROM hackathons", conn)
companies_df = pd.read_sql_query("SELECT * FROM companies", conn)
```

## Filters

- **Location**: Filter by city, state, or country
- **Date**: Filter hackathons by date range
- **Industry**: Filter companies by industry (Tech, Fintech, etc.)
- **Source**: Filter by data source
- **YC Backed**: Filter companies backed by Y Combinator

## Sources

1. **Devpost**: Active hackathons with sponsors and contacts
2. **Hack Club**: High school hackathons
3. **Y Combinator**: YC-backed companies interested in funding
4. **Crunchbase**: Companies with funding data
5. **AngelList**: Startup companies and investors
6. **Product Hunt**: Popular products and companies

## Database Schema

### Hackathons Table
- id (PRIMARY KEY)
- name
- link
- sponsors (JSON)
- contacts (JSON)
- yc_backed (BOOLEAN)
- funding_interest (JSON)
- location
- date
- source

### Companies Table
- id (PRIMARY KEY)
- name
- link
- yc_backed (BOOLEAN)
- funding_interest (JSON)
- industry
- location
- source

## Contributing

1. Add new scraping sources in `src/scraper.ts`
2. Update filters in the web interface
3. Enhance the database schema as needed

## License

MIT License
