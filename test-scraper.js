const axios = require('axios');

async function testScraper() {
  try {
    console.log('🚀 Triggering comprehensive scrape from all sources...');
    const response = await axios.post('http://localhost:3000/api/scrape', {}, { timeout: 30000 });
    console.log('✅ Scrape completed successfully!');
    console.log('📊 Results:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Error details:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received');
    } else {
      console.error('Error:', error.message);
    }
  }
}

testScraper();
