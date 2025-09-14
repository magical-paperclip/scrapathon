const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const { createObjectCsvWriter } = require('csv-writer');

// quick retry thing i wrote
async function retry(fn, retries = 3, delay = 1000) {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      console.log(`retrying... ${retries} left`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

// sleep helper
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// grab devpost hacks
async function grabDevpost() {
  console.log('grabbing devpost stuff...');
  let hacks = [];

  try {
    const response = await retry(() => axios.get('https://devpost.com/hackathons', {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    }));

    const $ = cheerio.load(response.data);
    const events = $('.hackathon-tile, .challenge-tile').toArray();
    console.log(`found ${events.length} things on devpost`);

    for (let i = 0; i < Math.min(events.length, 50); i++) {
      const element = events[i];
      try {
        const name = $(element).find('.title, h5').text().trim();
        const link = $(element).find('a').attr('href');
        const fullLink = link ? (link.startsWith('http') ? link : `https://devpost.com${link}`) : '';
        const location = $(element).find('.location, .subtitle').text().trim() || '';
        const date = $(element).find('.date, .time-remaining').text().trim() || '';

        if (name) {
          hacks.push({
            name: name,
            link: fullLink,
            sponsors: [],
            contacts: [],
            location: location,
            date: date,
            source: 'devpost'
          });
        }
      } catch (err) {
        console.log('skipping one devpost item:', err.message);
      }
    }
  } catch (err) {
    console.log('devpost failed:', err.message);
  }

  return hacks;
}

// get hackerearth challenges
async function grabHackerEarth() {
  console.log('checking hackerearth...');
  let hacks = [];

  try {
    const response = await retry(() => axios.get('https://www.hackerearth.com/challenges/', {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    }));

    const $ = cheerio.load(response.data);
    const challenges = $('.challenge-card, .upcoming-challenge').toArray();
    console.log(`got ${challenges.length} from hackerearth`);

    for (let i = 0; i < Math.min(challenges.length, 30); i++) {
      const element = challenges[i];
      try {
        const name = $(element).find('.challenge-title, .title').text().trim();
        const link = $(element).find('a').attr('href');
        const fullLink = link ? (link.startsWith('http') ? link : link) : '';
        const date = $(element).find('.date, .challenge-date').text().trim() || '';

        if (name && (name.toLowerCase().includes('hack') || name.toLowerCase().includes('challenge'))) {
          hacks.push({
            name: name,
            link: fullLink,
            sponsors: [],
            contacts: [],
            location: 'online',
            date: date,
            source: 'hackerearth'
          });
        }
      } catch (err) {
        console.log('skipping hackerearth item:', err.message);
      }
    }
  } catch (err) {
    console.log('hackerearth error:', err.message);
  }

  return hacks;
}

// eventbrite scraper - lots of cities
async function grabEventbrite() {
  console.log('hitting eventbrite...');
  let hacks = [];
  const cities = ['san-francisco', 'new-york', 'london', 'berlin', 'tokyo', 'singapore', 'bangalore', 'sydney', 'toronto', 'amsterdam', 'mumbai', 'delhi', 'chicago', 'los-angeles', 'seattle', 'austin', 'boston', 'miami', 'vancouver', 'montreal'];

  for (let city of cities) {
    try {
      const url = `https://www.eventbrite.com/d/${city}/hackathon/`;
      const response = await retry(() => axios.get(url, {
        timeout: 8000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      }));

      const $ = cheerio.load(response.data);
      const events = $('.event-card, .search-event-card, .eds-event-card').toArray();
      console.log(`found ${events.length} in ${city}`);

      for (let j = 0; j < Math.min(events.length, 15); j++) {
        const element = events[j];
        try {
          const name = $(element).find('.event-card__title, .eds-event-card__name, .eds-event-card__formatted-name__name').text().trim();
          const link = $(element).find('a').attr('href');
          const fullLink = link ? (link.startsWith('http') ? link : link) : '';
          const date = $(element).find('.event-card__date, .eds-event-card__formatted-date').text().trim() || '';
          const location = $(element).find('.event-card__venue, .eds-event-card__venue').text().trim() || city.replace('-', ' ');

          if (name && (name.toLowerCase().includes('hack') || name.toLowerCase().includes('code'))) {
            hacks.push({
              name: name,
              link: fullLink,
              sponsors: [],
              contacts: [],
              location: location,
              date: date,
              source: 'eventbrite'
            });
          }
        } catch (err) {
          console.log('skipping eventbrite item:', err.message);
        }
      }

      await sleep(500); // don't hammer the server
    } catch (err) {
      console.log(`eventbrite ${city} failed:`, err.message);
    }
  }

  return hacks;
}

// meetup groups
async function grabMeetup() {
  console.log('checking meetup...');
  let hacks = [];
  const cities = ['san-francisco', 'new-york', 'london', 'berlin', 'tokyo', 'singapore', 'bangalore', 'sydney', 'toronto', 'amsterdam', 'mumbai', 'delhi', 'chicago', 'los-angeles', 'seattle'];

  for (let city of cities) {
    try {
      const url = `https://www.meetup.com/cities/${city}/events/?keywords=hackathon`;
      const response = await retry(() => axios.get(url, {
        timeout: 8000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      }));

      const $ = cheerio.load(response.data);
      const events = $('.eventCard, .event-card').toArray();
      console.log(`got ${events.length} from ${city} meetup`);

      for (let k = 0; k < Math.min(events.length, 10); k++) {
        const element = events[k];
        try {
          const name = $(element).find('.eventCard--title, .event-title').text().trim();
          const link = $(element).find('a').attr('href');
          const fullLink = link ? (link.startsWith('http') ? link : `https://www.meetup.com${link}`) : '';
          const date = $(element).find('.eventCard--dateTime, .event-date').text().trim() || '';
          const location = $(element).find('.eventCard--venue, .event-venue').text().trim() || city.replace('-', ' ');

          if (name && (name.toLowerCase().includes('hack') || name.toLowerCase().includes('code'))) {
            hacks.push({
              name: name,
              link: fullLink,
              sponsors: [],
              contacts: [],
              location: location,
              date: date,
              source: 'meetup'
            });
          }
        } catch (err) {
          console.log('skipping meetup item:', err.message);
        }
      }

      await sleep(800); // be nice to meetup
    } catch (err) {
      console.log(`meetup ${city} error:`, err.message);
    }
  }

  return hacks;
}

// make up some company data since real scraping might get blocked
function makeFakeCompanies() {
  console.log('making fake companies...');
  let companies = [];
  const names = ['stripe', 'google', 'microsoft', 'amazon', 'meta', 'airbnb', 'uber', 'slack', 'dropbox', 'notion', 'figma', 'linear', 'superhuman', 'gitlab', 'github', 'vercel', 'netlify', 'heroku', 'digitalocean', 'linode', 'aws', 'azure', 'gcp', 'oracle', 'ibm', 'intel', 'amd', 'nvidia', 'tesla', 'spacex', 'openai', 'anthropic', 'cohere', 'huggingface', 'stabilityai', 'midjourney', 'runway', 'descript', 'synthesia', 'heygen', 'pika', 'runwayml', 'replit', 'codepen', 'glitch', 'stackblitz', 'codesandbox', 'mongodb', 'postgresql', 'redis', 'elasticsearch', 'kafka', 'rabbitmq', 'nats', 'docker', 'kubernetes', 'terraform', 'ansible', 'jenkins', 'gitlabci', 'githubactions', 'circleci', 'travisci', 'vercel', 'netlify', 'cloudflare', 'fastly', 'akamai', 'stripe', 'braintree', 'paypal', 'square', 'adyen', 'checkoutcom', 'revolut', 'wise', 'transferwise', 'coinbase', 'binance', 'kraken', 'ftx'];
  const industries = ['fintech', 'ai/ml', 'cloud', 'devtools', 'saas', 'ecommerce', 'social', 'gaming', 'health', 'education'];
  const locations = ['san francisco', 'new york', 'london', 'berlin', 'tokyo', 'singapore', 'bangalore', 'sydney', 'toronto', 'amsterdam'];

  // TODO: maybe add more variety later
  for (let i = 0; i < 10000; i++) {
    const name = names[Math.floor(Math.random() * names.length)];
    const industry = industries[Math.floor(Math.random() * industries.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];

    companies.push({
      name: `${name} ${i + 1}`,
      link: `https://${name.toLowerCase().replace(/\s+/g, '')}.com`,
      ycbacked: Math.random() > 0.7,
      fundinginterest: ['startups', 'hackathons', 'innovation'],
      industry: industry,
      location: location,
      source: 'fake'
    });
  }

  return companies;
}

// main runner
async function doTheThing() {
  console.log('lets get some data...');

  try {
    console.log('grabbing hackathons...');
    const results = await Promise.allSettled([
      grabDevpost(),
      grabHackerEarth(),
      grabEventbrite(),
      grabMeetup()
    ]);

    let hacks = [];
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        hacks = hacks.concat(result.value);
      }
    });

    console.log('making companies...');
    const companies = makeFakeCompanies();

    console.log(`got ${hacks.length} hacks and ${companies.length} companies`);

    console.log('saving stuff...');

    const hackWriter = createObjectCsvWriter({
      path: 'hacks.csv',
      header: [
        { id: 'name', title: 'name' },
        { id: 'link', title: 'link' },
        { id: 'location', title: 'location' },
        { id: 'date', title: 'date' },
        { id: 'source', title: 'source' }
      ]
    });

    await hackWriter.writeRecords(hacks);
    console.log(`saved ${hacks.length} hacks`);

    const companyWriter = createObjectCsvWriter({
      path: 'companies.csv',
      header: [
        { id: 'name', title: 'name' },
        { id: 'link', title: 'link' },
        { id: 'industry', title: 'industry' },
        { id: 'location', title: 'location' },
        { id: 'ycbacked', title: 'yc backed' },
        { id: 'source', title: 'source' }
      ]
    });

    await companyWriter.writeRecords(companies);
    console.log(`saved ${companies.length} companies`);

    const data = { hacks, companies, total: hacks.length + companies.length };
    fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
    console.log(`saved everything to json`);

    console.log(`done! total: ${hacks.length + companies.length} records!`);

  } catch (error) {
    console.error('something broke:', error.message);
  }
}

// run it
if (require.main === module) {
  doTheThing().catch(console.error);
}

module.exports = { doTheThing, grabDevpost, grabHackerEarth, grabEventbrite, grabMeetup };
