# hackathon scraper

a web scraper for collecting hackathon and company data from multiple sources. built with node.js, featuring parallel scraping, error handling, and multiple export formats.

## technical overview

**core technologies:**
- **node.js** with async/await for concurrent request handling
- **cheerio** - jquery-like dom manipulation for html parsing
- **axios** - http client with retry logic and request timeouts
- **csv-writer** - csv export functionality
- **sqlite3** - persistent database storage
- **express** - web server for api and dashboard

**scraping architecture:**
- **parallel execution** - runs 4 scrapers simultaneously using `promise.allsettled()`
- **rate limiting** - 500ms delays between requests to avoid blocking
- **retry logic** - exponential backoff (1s, 2s, 4s) with 3 maximum retries
- **user agents** - realistic browser headers for authenticity
- **error handling** - graceful failures with individual scraper isolation

## data sources

**devpost** (`https://devpost.com/hackathons`)
- css selectors: `.hackathon-tile`, `.challenge-tile`
- data extracted: name, link, location, date
- limit: first 50 events

**hackerearth** (`https://www.hackerearth.com/challenges/`)
- css selectors: `.challenge-card`, `.upcoming-challenge`
- data extracted: name, link, date
- filters: must contain "hack" or "challenge"
- limit: first 30 events

**eventbrite** (`https://www.eventbrite.com/d/{city}/hackathon/`)
- cities: sf, ny, london, berlin, tokyo, singapore, bangalore, etc. (20 total)
- css selectors: `.event-card`, `.search-event-card`, `.eds-event-card`
- data extracted: name, link, date, location
- filters: must contain "hack" or "code"
- limit: 15 events per city

**meetup** (`https://www.meetup.com/cities/{city}/events/?keywords=hackathon`)
- cities: 15 major tech hubs
- css selectors: `.eventcard`, `.event-card`
- data extracted: name, link, date, location
- filters: must contain "hack" or "code"
- limit: 10 events per city

## data structure

**hackathons dataset:**
```javascript
{
  name: "event name",
  link: "https://full-url.com",
  sponsors: [], // expandable for future use
  contacts: [], // expandable for future use
  location: "san francisco",
  date: "2025-01-15",
  source: "devpost" // devpost, hackerearth, eventbrite, meetup
}
```

**companies dataset:**
- **10,000 generated companies** using algorithmic generation
- **names**: from curated list of 80+ real tech companies (stripe, google, airbnb, etc.)
- **industries**: fintech, ai/ml, cloud, devtools, saas, ecommerce, social, gaming, health, education
- **locations**: 10 major tech cities worldwide
- **yc-backed**: 30% chance of yc funding status
- **funding interests**: ["startups", "hackathons", "innovation"]

## installation & usage

```bash
# clone the repository
git clone https://github.com/magical-paperclip/scrapathon.git
cd scrapathon

# install dependencies
npm install

# build the typescript
npm run build

# run the scraper
npm run scrape

# or start the web server
npm start
```

## api endpoints

**hackathons:**
- `get /api/hackathons` - fetch hackathons with query parameters
- `get /api/hackathons?location=san-francisco&source=devpost`

**companies:**
- `get /api/companies` - fetch companies with filters
- `get /api/companies?industry=fintech&ycbacked=true`

**scraping:**
- `post /api/scrape` - trigger a new scraping operation

## output files

**hacks.csv** - all scraped hackathon data
**companies.csv** - all generated company data
**data.json** - combined dataset in json format

## graphs & trend analysis

### visualization dashboard

the dataset enables rich data visualization and trend analysis through various chart types and analytics:

#### geographic distribution charts

- **hackathon density map** - interactive map showing hackathon concentration by city
- **company location heatmap** - geographic distribution of tech companies and their funding status
- **regional comparison bars** - side-by-side comparison of hackathon activity across continents

#### temporal trend analysis

- **monthly hackathon frequency** - line chart showing seasonal patterns in hackathon scheduling
- **year-over-year growth** - trend lines comparing hackathon numbers across years
- **weekday distribution** - bar chart showing which days of the week have most hackathons

#### industry & sector insights

- **company industry pie chart** - distribution of companies across fintech, ai/ml, cloud, devtools, etc.
- **yc-backed vs traditional** - stacked bar chart comparing yc-funded vs non-yc companies
- **funding interest radar** - spider chart showing company focus areas (startups, hackathons, innovation)

#### platform comparison analytics

- **source distribution** - pie chart showing data breakdown by devpost, hackerearth, eventbrite, meetup
- **platform quality metrics** - radar chart comparing event sizes and sponsor levels across platforms
- **scraping success rates** - bar chart showing data collection efficiency per source

### trend analysis capabilities

#### predictive modeling

- **hackathon forecasting** - predict future hackathon numbers based on historical data
- **company growth trends** - analyze industry sector expansion rates
- **location-based predictions** - forecast tech ecosystem growth in specific cities

#### correlation analysis

- **hackathon vs company density** - scatter plots showing relationship between hackathon frequency and company presence
- **funding status correlations** - analyze how yc-backed status relates to hackathon sponsorship
- **industry clustering** - identify which industries cluster in specific geographic regions

#### time series analysis

- **seasonal patterns** - identify peak hackathon months and low-activity periods
- **growth rate calculations** - measure year-over-year changes in hackathon ecosystem
- **market saturation** - detect when cities reach maximum hackathon capacity

### interactive features

#### filtering & drill-down

- **location filters** - zoom into specific cities or regions
- **date range selectors** - analyze data for specific time periods
- **industry filters** - focus on specific technology sectors
- **funding status toggles** - compare yc-backed vs traditional companies

#### real-time updates

- **live data refresh** - automatically update charts when new data is scraped
- **incremental analysis** - add new data points without recalculating entire dataset
- **alert system** - notifications for significant trend changes

#### export capabilities

- **chart exports** - save visualizations as png, svg, or pdf formats
- **data exports** - download filtered datasets for external analysis
- **report generation** - create automated summary reports with key insights

### advanced analytics

#### machine learning insights

- **clustering algorithms** - group similar hackathons by theme, size, and location
- **anomaly detection** - identify unusual patterns in hackathon scheduling or company distribution
- **recommendation engine** - suggest optimal hackathons for specific company profiles

#### network analysis

- **sponsor networks** - visualize connections between companies and hackathons they sponsor
- **location networks** - map relationships between cities based on shared hackathon themes
- **industry networks** - show cross-industry collaboration patterns

#### statistical analysis

- **correlation matrices** - identify relationships between different data dimensions
- **regression analysis** - predict hackathon success based on multiple variables
- **hypothesis testing** - statistically validate observed trends and patterns

## scraping implementation

the scraper collects hackathon and company data through a multi-stage process:

### source processing

**devpost processing** - extracts active hackathons from devpost.com/hackathons

- targets `.hackathon-tile` and `.challenge-tile` elements
- extracts name, link, location, and date information
- filters for hackathon-related events only

**hackerearth processing** - scrapes hackerearth.com/challenges

- locates `.challenge-card` and `.upcoming-challenge` elements
- extracts challenge names and registration links
- filters out non-hackathon content

**eventbrite processing** - searches city-specific hackathon pages

- queries `eventbrite.com/d/san-francisco/hackathon/` and similar urls
- processes multiple cities: sf, ny, london, berlin, tokyo, singapore, bangalore, etc.
- targets `.event-card` and `.eds-event-card` elements
- filters events containing "hack" or "code" keywords

**meetup processing** - finds local hackathon communities

- searches `meetup.com/cities/{city}/events/?keywords=hackathon`
- covers major tech hubs with hackathon activity
- extracts `.eventcard` and `.event-card` elements

### data collection pipeline

for each discovered hackathon, the system collects:

- event name and description
- registration/event link
- geographic location (city/country)
- date and time information
- source platform identifier
- available sponsor information
- contact details when accessible

### operational safeguards

- **rate limiting**: 500ms delays between eventbrite city searches, 800ms for meetup
- **anti-detection**: realistic user agent strings to avoid blocking
- **retry mechanism**: exponential backoff with 3 maximum retry attempts
- **timeout protection**: 8-10 second request timeouts to prevent hanging

### error management

- **exception handling**: comprehensive try/catch blocks throughout
- **fault isolation**: individual scraper failures don't terminate the entire process
- **promise management**: uses `promise.allsettled()` for parallel execution
- **graceful degradation**: skips problematic items while continuing data collection

### data refinement

- **content cleaning**: removes html entities and excess whitespace
- **link validation**: ensures proper https prefixes on urls
- **content filtering**: excludes non-hackathon events from results
- **deduplication**: removes duplicate entries from multiple sources
- **format export**: saves data to csv, json, and sqlite formats

### synthetic data generation

to supplement real scraping data, the system generates 10,000 artificial company records:

- **realistic names**: uses authentic tech company names (stripe, google, airbnb, etc.)
- **industry distribution**: covers fintech, ai/ml, cloud, devtools, saas, and other sectors
- **geographic spread**: distributes across major global tech cities
- **funding status**: 70% probability of yc-backed designation
- **interest arrays**: includes relevant funding focus areas

the scraper executes all data sources concurrently and merges results into a unified dataset.

## database schema

### hackathons table

- id (primary key)
- name
- link
- sponsors (json)
- contacts (json)
- yc_backed (boolean)
- funding_interest (json)
- location
- date
- source

### companies table

- id (primary key)
- name
- link
- yc_backed (boolean)
- funding_interest (json)
- industry
- location
- source

## extension points

1. add new scraping sources in `src/scraper.ts`
2. update filters in the web interface
3. modify the database schema as needed

## license

mit license
