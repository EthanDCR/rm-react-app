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

app.post('/verify/lookup', async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  try {
    const url = `https://www.phonevalidator.com/api/verify?Phone=${encodeURIComponent(phoneNumber)}&Key=${phoneValidatorKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      console.error('PhoneValidator API error:', data);
      return res.status(500).json({ error: 'Validation API failed', details: data });
    }

    res.json({
      valid: data.IsValid === 'Yes',
      disconnected: data.IsDisconnected === 'Yes',
      suspended: data.IsSuspended === 'Yes',
      carrier: data.Carrier,
      line_type: data.LineType,
      country: data.Country,
      raw: data
    });
  } catch (error) {
    console.error('PhoneValidator fetch error:', error);
    res.status(500).json({ error: 'Phone validation failed' });
  }
});






// === /verify/lookup: Validate phone number using PhoneValidator ===
app.post('/verify/lookup', async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  try {
    const response = await fetch(`https://phonevalidator.com/api/v2/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${phoneValidatorKey}`
      },
      body: JSON.stringify({ phone: phoneNumber })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('PhoneValidator API error:', result);
      return res.status(500).json({ error: 'Validation API failed', details: result });
    }

    res.json({
      valid: result.is_valid,
      disconnected: result.is_disconnected,
      suspended: result.is_suspended,
      carrier: result.carrier,
      line_type: result.line_type,
      country: result.country_name,
      raw: result
    });
  } catch (error) {
    console.error('PhoneValidator fetch error:', error);
    res.status(500).json({ error: 'Phone validation failed' });
  }
});

// === Health check ===
app.get('/', (req, res) => {
  res.send('API is up and running!');
});

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
