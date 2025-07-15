require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 5000;
const apiKey = process.env.BATCHDATA_API_KEY;

app.use(cors({
  origin: '*', // or specify your frontend URL for more security
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


app.use(express.json());

app.post('/lookup', async (req, res) => {
  const { address } = req.body;
  console.log('Received address string:', address);

  if (!address) {
    return res.status(400).json({ error: 'Address is required' });
  }

  // Naive split: assumes "Street, City, State ZIP, Country"
  const parts = address.split(',');
  if (parts.length < 3) {
    return res.status(400).json({ error: 'Invalid address format' });
  }

  const street = parts[0].trim();
  const city = parts[1].trim();
  const [state, zip] = parts[2].trim().split(' ');

  console.log('Parsed address for BatchData:', { street, city, state, zip });

  try {

    
console.log('Sending to BatchData with:', {
  apiKey: apiKey ? '[present]' : '[missing]',
  url: 'https://api.batchdata.com/v1/property/skip-trace/sync',
  headers: {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: {
    data: [
      { address: street, city, state, zip }
    ]
  }
});


 
const response = await fetch('https://api.batchdata.com/api/v1/property/skip-trace', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  },
  body: JSON.stringify({
    requests: [
      {
        propertyAddress: {
          street,
          city,
          state,
          zip
        }
      }
    ]
  })
});
    const data = await response.json();
    console.log(data); 
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


app.get('/', (req, res) => {
  res.send('API is up and running!');
});


app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
