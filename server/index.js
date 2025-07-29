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

app.post('/lookup', async (req, res) => {
  const { address } = req.body;
  console.log("raw adress from request:", address);


  if (!address) return res.status(400).json({ error: 'Address is required' });

  
const parseAddress = (raw) => {
  const cleaned = raw.replace(/\s+/g, ' ').trim();
  const parts = cleaned.split(',').map(p => p.trim());

  let street = '', city = '', state = '', zip = '';

  if (parts.length === 4) {
    [street, city, state, zip] = parts;
  } else if (parts.length === 3) {
    [street, city, state] = parts;
    const stateParts = state.split(' ');
    if (stateParts.length > 1) {
      state = stateParts[0];
      zip = stateParts[1];
    }
  } else if (parts.length === 2) {
    [street, state] = parts;
    const stateParts = state.split(' ');
    if (stateParts.length > 1) {
      state = stateParts[0];
      zip = stateParts[1];
    }
  }

  return { street, city, state, zip };
};

const { street, city, state, zip } = parseAddress(address);
console.log('Parsed address:', { street, city, state, zip });

  if (!street || !state) {
  console.error('Address parsing failed:', address);
  return res.status(400).json({ error: 'Address could not be parsed correctly' });
}

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
