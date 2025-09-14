const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
  res.send('Server is running!');
});

app.post('/api/scrape', (req, res) => {
  res.json({ message: 'Scrape endpoint working', status: 'success' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
