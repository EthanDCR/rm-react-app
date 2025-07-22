require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 5000;
const apiKey = process.env.BATCHDATA_API_KEY;
const phoneValidatorKey = process.env.PHONEVALIDATOR_API_KEY;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// ✅ /lookup route (BatchData)
app.post('/lookup', async (req, res) => {
  const { address } = req.body;
  if (!address) return res.status(400).json({ error: 'Address is required' });


const parts = address.split(',');
if (parts.length < 3) {
  return res.status(400).json({ error: 'Invalid address format' });
}

const street = parts[0].trim();
const city = parts[1].trim();
const stateZip = parts[2].trim().split(' ');
const state = stateZip[0];
const zip = stateZip[1] || '';

  console.log('Parsed address:', { street, city, state, zip });




  try {
    const response = await fetch('https://api.batchdata.com/api/v1/property/skip-trace', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        requests: [
          {
            propertyAddress: {
              street, city, state, zip
            }
          }
        ]
      })
    });

    const data = await response.json();
    console.log('BatchData response:', JSON.stringify(data, null, 2));
   if (!response.ok) {
      console.error('BatchData API error:', data);
      return res.status(500).json({ error: data.status?.message || 'Unknown error' });
    }

    res.json(data);
  } catch (err) {
    console.error('BatchData error:', err);
    res.status(500).json({ error: 'Failed to fetch from BatchData' });
  }
});


app.post('/verify/lookup', async (req, res) => {
  const { phoneNumber } = req.body;
  const cleanedNumber = phoneNumber.replace(/\D/g, ''); // removes all non-digit characters
 
  if (!phoneNumber) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  try {
    const url = `https://api.phonevalidator.com/api/v3/phonesearch?apikey=${phoneValidatorKey}&phone=${cleanedNumber}&type=basic`;
    console.log('Requesting:', url);

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || data.StatusCode !== "200") {
      console.error('PhoneValidator API error:', data);
      return res.status(500).json({ error: 'Validation API failed', details: data });
    }

    res.json({
      valid: data.PhoneBasic?.FakeNumber === "NO",
      disconnected: false, // This API doesn't give that info
      suspended: false,    // Same here
      carrier: data.PhoneBasic?.PhoneCompany,
      line_type: data.PhoneBasic?.LineType,
      location: data.PhoneBasic?.PhoneLocation,
      raw: data
    });
  } catch (error) {
    console.error('PhoneValidator fetch error:', error);
    res.status(500).json({ error: 'Phone validation failed' });
  }
});



// ✅ Health check
app.get('/', (req, res) => {
  res.send('API is up and running!');
});

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
