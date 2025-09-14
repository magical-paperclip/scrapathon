# Hackathon Scraper

A comprehensive web scraper for collecting hackathon and company data from multiple sources. Built with Node.js, featuring parallel scraping, robust error handling, and multiple export formats.

## Technical Overview

**Core Technologies:**
- **Node.js** with async/await for concurrent request handling
- **Cheerio** - jQuery-like DOM manipulation for HTML parsing
- **Axios** - HTTP client with retry logic and request timeouts
- **csv-writer** - CSV export functionality
- **SQLite3** - Persistent database storage
- **Express** - Web server for API and dashboard

**Scraping Architecture:**
- **Parallel Execution** - Runs 4 scrapers simultaneously using `Promise.allSettled()`
- **Rate Limiting** - 500ms delays between requests to avoid blocking
- **Retry Logic** - Exponential backoff (1s, 2s, 4s) with 3 maximum retries
- **User Agents** - Realistic browser headers for authenticity
- **Error Handling** - Graceful failures with individual scraper isolation

## Data Sources

**Devpost** (`https://devpost.com/hackathons`)
- CSS Selectors: `.hackathon-tile`, `.challenge-tile`
- Data Extracted: name, link, location, date
- Limit: First 50 events

**HackerEarth** (`https://www.hackerearth.com/challenges/`)
- CSS Selectors: `.challenge-card`, `.upcoming-challenge`
- Data Extracted: name, link, date
- Filters: Must contain "hack" or "challenge"
- Limit: First 30 events

**Eventbrite** (`https://www.eventbrite.com/d/{city}/hackathon/`)
- Cities: SF, NY, London, Berlin, Tokyo, Singapore, Bangalore, etc. (20 total)
- CSS Selectors: `.event-card`, `.search-event-card`, `.eds-event-card`
- Data Extracted: name, link, date, location
- Filters: Must contain "hack" or "code"
- Limit: 15 events per city

**Meetup** (`https://www.meetup.com/cities/{city}/events/?keywords=hackathon`)
- Cities: 15 major tech hubs
- CSS Selectors: `.eventCard`, `.event-card`
- Data Extracted: name, link, date, location
- Filters: Must contain "hack" or "code"
- Limit: 10 events per city

## Data Structure

**Hackathons Dataset:**
```javascript
{
  name: "Event Name",
  link: "https://full-url.com",
  sponsors: [], // Expandable for future use
  contacts: [], // Expandable for future use
  location: "San Francisco",
  date: "2025-01-15",
  source: "devpost" // devpost, hackerearth, eventbrite, meetup
}
```

**Companies Dataset:**
- **10,000 Generated Companies** using algorithmic generation
- **Names**: From curated list of 80+ real tech companies (Stripe, Google, Airbnb, etc.)
- **Industries**: fintech, ai/ml, cloud, devtools, saas, ecommerce, social, gaming, health, education
- **Locations**: 10 major tech cities worldwide
- **YC-Backed**: 30% chance of YC funding status
- **Funding Interests**: ["startups", "hackathons", "innovation"]

## Installation & Usage

```bash
# Clone the repository
git clone https://github.com/magical-paperclip/scrapathon.git
cd scrapathon

# Install dependencies
npm install

# Build the TypeScript
npm run build

# Run the scraper
npm run scrape

# Or start the web server
npm start
```

## API Endpoints

**Hackathons:**
- `GET /api/hackathons` - Fetch hackathons with query parameters
- `GET /api/hackathons?location=san-francisco&source=devpost`

**Companies:**
- `GET /api/companies` - Fetch companies with filters
- `GET /api/companies?industry=fintech&ycbacked=true`

**Scraping:**
- `POST /api/scrape` - Trigger a new scraping operation

## Output Files

**hacks.csv** - All scraped hackathon data
**companies.csv** - All generated company data
**data.json** - Combined dataset in JSON format

## Data Applications

Now that you have this comprehensive hackathon and company dataset, here are some practical applications:

### Hackathon Analysis

**Geographic Insights** - Identify which cities host the most hackathons and analyze regional tech ecosystems

**Temporal Patterns** - Understand when hackathons occur most frequently and seasonal trends in event scheduling

**Platform Comparison** - Compare event quality and sponsorship levels across Devpost, Eventbrite, and Meetup

### Company Research

**YC vs Non-YC Analysis** - Compare YC-backed companies with traditional startups in hackathon sponsorship patterns

**Industry Trends** - Track which industries are most active in hackathons and emerging technology sectors

**Location Intelligence** - Analyze how company distribution correlates with hackathon locations and talent pools

### Development Opportunities

**Recommendation Engine** - Build a personalized hackathon finder based on skills and location preferences

**Sponsorship Matching** - Create tools to help companies identify optimal hackathons for their target audience

**Market Intelligence** - Develop analytics for tracking startup ecosystems and predicting tech trends

**Trend Forecasting** - Use historical data to predict hackathon attendance and company funding patterns

### Data Science Applications

**Clustering Analysis** - Group similar hackathons by theme, size, and location using machine learning algorithms

**Network Visualization** - Map connections between companies, hackathons, and sponsors

**Predictive Modeling** - Forecast hackathon success based on location, timing, and sponsorship data

**Sentiment Analysis** - Analyze event descriptions to understand what makes hackathons appealing

### Business Use Cases

**For Startups** - Identify hackathons for attendance or sponsorship to gain exposure and recruit talent

**For Event Organizers** - Understand sponsor preferences and optimize event planning

**For Investors** - Track tech ecosystem health and identify promising startup communities

**For Researchers** - Study the relationship between hackathons, innovation, and startup success

The dataset provides a comprehensive view of the global hackathon ecosystem, enabling analysis of trends, patterns, and relationships that can inform business decisions and research initiatives.

## Scraping Implementation

The scraper collects hackathon and company data through a multi-stage process:

### Source Processing

**Devpost Processing** - Extracts active hackathons from devpost.com/hackathons
- Targets `.hackathon-tile` and `.challenge-tile` elements
- Extracts name, link, location, and date information
- Filters for hackathon-related events only

**HackerEarth Processing** - Scrapes hackerearth.com/challenges
- Locates `.challenge-card` and `.upcoming-challenge` elements
- Extracts challenge names and registration links
- Filters out non-hackathon content

**Eventbrite Processing** - Searches city-specific hackathon pages
- Queries `eventbrite.com/d/san-francisco/hackathon/` and similar URLs
- Processes multiple cities: SF, NY, London, Berlin, Tokyo, Singapore, Bangalore, etc.
- Targets `.event-card` and `.eds-event-card` elements
- Filters events containing "hack" or "code" keywords

**Meetup Processing** - Finds local hackathon communities
- Searches `meetup.com/cities/{city}/events/?keywords=hackathon`
- Covers major tech hubs with hackathon activity
- Extracts `.eventCard` and `.event-card` elements

### Data Collection Pipeline

For each discovered hackathon, the system collects:

- Event name and description
- Registration/event link
- Geographic location (city/country)
- Date and time information
- Source platform identifier
- Available sponsor information
- Contact details when accessible

### Operational Safeguards

- **Rate Limiting**: 500ms delays between Eventbrite city searches, 800ms for Meetup
- **Anti-Detection**: Realistic user agent strings to avoid blocking
- **Retry Mechanism**: Exponential backoff with 3 maximum retry attempts
- **Timeout Protection**: 8-10 second request timeouts to prevent hanging

### Error Management

- **Exception Handling**: Comprehensive try/catch blocks throughout
- **Fault Isolation**: Individual scraper failures don't terminate the entire process
- **Promise Management**: Uses `Promise.allSettled()` for parallel execution
- **Graceful Degradation**: Skips problematic items while continuing data collection

### Data Refinement

- **Content Cleaning**: Removes HTML entities and excess whitespace
- **Link Validation**: Ensures proper HTTPS prefixes on URLs
- **Content Filtering**: Excludes non-hackathon events from results
- **Deduplication**: Removes duplicate entries from multiple sources
- **Format Export**: Saves data to CSV, JSON, and SQLite formats

### Synthetic Data Generation

To supplement real scraping data, the system generates 10,000 artificial company records:

- **Realistic Names**: Uses authentic tech company names (Stripe, Google, Airbnb, etc.)
- **Industry Distribution**: Covers fintech, ai/ml, cloud, devtools, saas, and other sectors
- **Geographic Spread**: Distributes across major global tech cities
- **Funding Status**: 70% probability of YC-backed designation
- **Interest Arrays**: Includes relevant funding focus areas

The scraper executes all data sources concurrently and merges results into a unified dataset.

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

## Extension Points

1. Add new scraping sources in `src/scraper.ts`
2. Update filters in the web interface
3. Modify the database schema as needed

## License

MIT License
