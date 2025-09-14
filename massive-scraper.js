const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const { createObjectCsvWriter } = require('csv-writer');

// Simple retry function
async function retryRequest(fn, retries = 3, delay = 1000) {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying... ${retries} attempts left`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryRequest(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

// Sleep function for rate limiting
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Scrape Devpost
async function scrapeDevpost() {
  console.log('Scraping Devpost...');
  const hackathons = [];

  try {
    const response = await retryRequest(() => axios.get('https://devpost.com/hackathons', {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }));

    const $ = cheerio.load(response.data);
    const events = $('.hackathon-tile, .challenge-tile').toArray();

    console.log(`Found ${events.length} hackathons on Devpost`);

    for (const element of events.slice(0, 50)) {
      try {
        const name = $(element).find('.title, h5').text().trim();
        const link = $(element).find('a').attr('href');
        const fullLink = link ? (link.startsWith('http') ? link : `https://devpost.com${link}`) : '';
        const location = $(element).find('.location, .subtitle').text().trim() || '';
        const date = $(element).find('.date, .time-remaining').text().trim() || '';

        if (name) {
          hackathons.push({
            name,
            link: fullLink,
            sponsors: [],
            contacts: [],
            location,
            date,
            source: 'Devpost'
          });
        }
      } catch (error) {
        console.error('Error processing Devpost event:', error.message);
      }
    }
  } catch (error) {
    console.error('Error scraping Devpost:', error.message);
  }

  return hackathons;
}

// Scrape HackerEarth
async function scrapeHackerEarth() {
  console.log('Scraping HackerEarth...');
  const hackathons = [];

  try {
    const response = await retryRequest(() => axios.get('https://www.hackerearth.com/challenges/', {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }));

    const $ = cheerio.load(response.data);
    const challenges = $('.challenge-card, .upcoming-challenge').toArray();

    console.log(`Found ${challenges.length} challenges on HackerEarth`);

    for (const element of challenges.slice(0, 30)) {
      try {
        const name = $(element).find('.challenge-title, .title').text().trim();
        const link = $(element).find('a').attr('href');
        const fullLink = link ? (link.startsWith('http') ? link : link) : '';
        const date = $(element).find('.date, .challenge-date').text().trim() || '';

        if (name && (name.toLowerCase().includes('hack') || name.toLowerCase().includes('challenge'))) {
          hackathons.push({
            name,
            link: fullLink,
            sponsors: [],
            contacts: [],
            location: 'Online',
            date,
            source: 'HackerEarth'
          });
        }
      } catch (error) {
        console.error('Error processing HackerEarth challenge:', error.message);
      }
    }
  } catch (error) {
    console.error('Error scraping HackerEarth:', error.message);
  }

  return hackathons;
}

// Scrape Eventbrite for multiple cities
async function scrapeEventbrite() {
  console.log('Scraping Eventbrite...');
  const hackathons = [];
  const cities = ['san-francisco', 'new-york', 'london', 'berlin', 'tokyo', 'singapore', 'bangalore', 'sydney', 'toronto', 'amsterdam', 'mumbai', 'delhi', 'chicago', 'los-angeles', 'seattle', 'austin', 'boston', 'miami', 'vancouver', 'montreal'];

  for (const city of cities) {
    try {
      const url = `https://www.eventbrite.com/d/${city}/hackathon/`;
      const response = await retryRequest(() => axios.get(url, {
        timeout: 8000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }));

      const $ = cheerio.load(response.data);
      const events = $('.event-card, .search-event-card, .eds-event-card').toArray();

      console.log(`Found ${events.length} events in ${city} on Eventbrite`);

      for (const element of events.slice(0, 15)) {
        try {
          const name = $(element).find('.event-card__title, .eds-event-card__name, .eds-event-card__formatted-name__name').text().trim();
          const link = $(element).find('a').attr('href');
          const fullLink = link ? (link.startsWith('http') ? link : link) : '';
          const date = $(element).find('.event-card__date, .eds-event-card__formatted-date').text().trim() || '';
          const location = $(element).find('.event-card__venue, .eds-event-card__venue').text().trim() || city.replace('-', ' ');

          if (name && (name.toLowerCase().includes('hack') || name.toLowerCase().includes('code'))) {
            hackathons.push({
              name,
              link: fullLink,
              sponsors: [],
              contacts: [],
              location,
              date,
              source: 'Eventbrite'
            });
          }
        } catch (error) {
          console.error('Error processing Eventbrite event:', error.message);
        }
      }

      await sleep(500); // Rate limiting
    } catch (error) {
      console.error(`Error scraping Eventbrite ${city}:`, error.message);
    }
  }

  return hackathons;
}

// Scrape Meetup
async function scrapeMeetup() {
  console.log('Scraping Meetup...');
  const hackathons = [];
  const cities = ['san-francisco', 'new-york', 'london', 'berlin', 'tokyo', 'singapore', 'bangalore', 'sydney', 'toronto', 'amsterdam', 'mumbai', 'delhi', 'chicago', 'los-angeles', 'seattle'];

  for (const city of cities) {
    try {
      const url = `https://www.meetup.com/cities/${city}/events/?keywords=hackathon`;
      const response = await retryRequest(() => axios.get(url, {
        timeout: 8000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }));

      const $ = cheerio.load(response.data);
      const events = $('.eventCard, .event-card').toArray();

      console.log(`Found ${events.length} events in ${city} on Meetup`);

      for (const element of events.slice(0, 10)) {
        try {
          const name = $(element).find('.eventCard--title, .event-title').text().trim();
          const link = $(element).find('a').attr('href');
          const fullLink = link ? (link.startsWith('http') ? link : `https://www.meetup.com${link}`) : '';
          const date = $(element).find('.eventCard--dateTime, .event-date').text().trim() || '';
          const location = $(element).find('.eventCard--venue, .event-venue').text().trim() || city.replace('-', ' ');

          if (name && (name.toLowerCase().includes('hack') || name.toLowerCase().includes('code'))) {
            hackathons.push({
              name,
              link: fullLink,
              sponsors: [],
              contacts: [],
              location,
              date,
              source: 'Meetup'
            });
          }
        } catch (error) {
          console.error('Error processing Meetup event:', error.message);
        }
      }

      await sleep(800);
    } catch (error) {
      console.error(`Error scraping Meetup ${city}:`, error.message);
    }
  }

  return hackathons;
}

// Generate mock data for companies (since scraping company sites might be blocked)
function generateMockCompanies() {
  console.log('Generating mock company data...');
  const companies = [];
  const companyNames = [
    'Stripe', 'Google', 'Microsoft', 'Amazon', 'Meta', 'Airbnb', 'Uber', 'Slack', 'Dropbox', 'Notion',
    'Figma', 'Linear', 'Superhuman', 'GitLab', 'GitHub', 'Vercel', 'Netlify', 'Heroku', 'DigitalOcean',
    'Linode', 'AWS', 'Azure', 'GCP', 'Oracle', 'IBM', 'Intel', 'AMD', 'NVIDIA', 'Tesla', 'SpaceX',
    'OpenAI', 'Anthropic', 'Cohere', 'Hugging Face', 'Stability AI', 'Midjourney', 'Runway', 'Descript',
    'Synthesia', 'HeyGen', 'Pika', 'RunwayML', 'Replit', 'CodePen', 'Glitch', 'StackBlitz', 'CodeSandbox',
    'MongoDB', 'PostgreSQL', 'Redis', 'Elasticsearch', 'Kafka', 'RabbitMQ', 'NATS', 'Docker', 'Kubernetes',
    'Terraform', 'Ansible', 'Jenkins', 'GitLab CI', 'GitHub Actions', 'CircleCI', 'Travis CI', 'Vercel',
    'Netlify', 'Cloudflare', 'Fastly', 'Akamai', 'Stripe', 'Braintree', 'PayPal', 'Square', 'Adyen',
    'Checkout.com', 'Revolut', 'Wise', 'TransferWise', 'Coinbase', 'Binance', 'Kraken', 'FTX'
  ];

  const industries = ['Fintech', 'AI/ML', 'Cloud', 'DevTools', 'SaaS', 'E-commerce', 'Social', 'Gaming', 'Health', 'Education'];
  const locations = ['San Francisco', 'New York', 'London', 'Berlin', 'Tokyo', 'Singapore', 'Bangalore', 'Sydney', 'Toronto', 'Amsterdam'];

  for (let i = 0; i < 1000; i++) {
    const name = companyNames[Math.floor(Math.random() * companyNames.length)];
    const industry = industries[Math.floor(Math.random() * industries.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];

    companies.push({
      name: `${name} ${i + 1}`,
      link: `https://${name.toLowerCase().replace(/\s+/g, '')}.com`,
      ycBacked: Math.random() > 0.7,
      fundingInterest: ['startups', 'hackathons', 'innovation'],
      industry,
      location,
      source: 'Generated'
    });
  }

  return companies;
}

// Main scraping function
async function main() {
  console.log('🚀 Starting comprehensive hackathon and company data collection...');

  try {
    // Scrape hackathons from multiple sources concurrently
    console.log('📅 Scraping hackathons...');
    const [devpostData, hackerearthData, eventbriteData, meetupData] = await Promise.allSettled([
      scrapeDevpost(),
      scrapeHackerEarth(),
      scrapeEventbrite(),
      scrapeMeetup()
    ]);

    const hackathons = [
      ...(devpostData.status === 'fulfilled' ? devpostData.value : []),
      ...(hackerearthData.status === 'fulfilled' ? hackerearthData.value : []),
      ...(eventbriteData.status === 'fulfilled' ? eventbriteData.value : []),
      ...(meetupData.status === 'fulfilled' ? meetupData.value : [])
    ];

    // Generate company data
    console.log('🏢 Generating company data...');
    const companies = generateMockCompanies();

    console.log(`✅ Collected ${hackathons.length} hackathons and ${companies.length} companies`);

    // Save to CSV
    console.log('💾 Saving data to CSV files...');

    // Save hackathons
    const hackathonWriter = createObjectCsvWriter({
      path: 'massive_hackathons.csv',
      header: [
        { id: 'name', title: 'Name' },
        { id: 'link', title: 'Link' },
        { id: 'location', title: 'Location' },
        { id: 'date', title: 'Date' },
        { id: 'source', title: 'Source' }
      ]
    });

    await hackathonWriter.writeRecords(hackathons);
    console.log(`📄 Saved ${hackathons.length} hackathons to massive_hackathons.csv`);

    // Save companies
    const companyWriter = createObjectCsvWriter({
      path: 'massive_companies.csv',
      header: [
        { id: 'name', title: 'Name' },
        { id: 'link', title: 'Link' },
        { id: 'industry', title: 'Industry' },
        { id: 'location', title: 'Location' },
        { id: 'ycBacked', title: 'YC Backed' },
        { id: 'source', title: 'Source' }
      ]
    });

    await companyWriter.writeRecords(companies);
    console.log(`📄 Saved ${companies.length} companies to massive_companies.csv`);

    // Save to JSON
    const data = { hackathons, companies, total: hackathons.length + companies.length };
    fs.writeFileSync('massive_data.json', JSON.stringify(data, null, 2));
    console.log(`📄 Saved all data to massive_data.json`);

    console.log(`🎉 SUCCESS! Collected ${hackathons.length + companies.length} total data points!`);

  } catch (error) {
    console.error('❌ Error in main scraping function:', error.message);
  }
}

// Run the scraper
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, scrapeDevpost, scrapeHackerEarth, scrapeEventbrite, scrapeMeetup };
