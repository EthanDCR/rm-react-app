require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 5000;
const apiKey = process.env.BATCHDATA_API_KEY;

app.use(cors());
app.use(express.json());



app.post('/lookup', async (req, res) => {
  const { street, city, state, zip } = req.body;

  if (!street || !city || !state || !zip) {
    return res.status(400).json({ error: 'Missing address parts' });
  }

  try {
    
    console.log(apiKey);

    console.log('Sending to BatchData:', {
  url: 'https://api.batchdata.com/v1/property/skip-trace',
  headers: {
    'Authorization': `Bearer ${apiKey}`
  },
  body: {
    data: [
      { address: street, city, state, zip }
    ]
  }
});
    const response = await fetch('https://api.batchdata.com/v1/property/skip-trace', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        data: [
          { address: street, city, state, zip }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('BatchData API error:', data);
      return res.status(500).json({ error: data.status?.message || 'Unknown error' });
    }

    res.json(data);
  } catch (err) {
    console.error('Error fetching from BatchData:', err);
    res.status(500).json({ error: 'Failed to reach BatchData API' });
  }
});





app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
