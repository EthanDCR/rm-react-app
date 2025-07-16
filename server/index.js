require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const twilio = require('twilio');

const app = express();
const PORT = process.env.PORT || 5000;

// API keys
const apiKey = process.env.BATCHDATA_API_KEY;
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

/**
 * === Lookup Route ===
 * Receives a full address, sends it to BatchData API, returns skip trace results.
 */
app.post('/lookup', async (req, res) => {
  const { address } = req.body;
  console.log('Received address string:', address);

  if (!address) {
    return res.status(400).json({ error: 'Address is required' });
  }

  const parts = address.split(',');
  if (parts.length < 3) {
    return res.status(400).json({ error: 'Invalid address format' });
  }

  const street = parts[0].trim();
  const city = parts[1].trim();
  const [state, zip] = parts[2].trim().split(' ');

  console.log('Parsed address for BatchData:', { street, city, state, zip });

  try {
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

/**
 * === Twilio Verify: Start SMS Code ===
 */
app.post('/verify/start', async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  try {
    const verification = await twilioClient.verify.v2
      .services(verifySid)
      .verifications
      .create({ to: phoneNumber, channel: 'sms' });

    res.json({ status: verification.status });
  } catch (error) {
    console.error('Twilio verify/start error:', error);
    res.status(500).json({ error: 'Failed to start verification' });
  }
});

/**
 * === Twilio Verify: Check Code ===
 */
app.post('/verify/check', async (req, res) => {
  const { phoneNumber, code } = req.body;

  if (!phoneNumber || !code) {
    return res.status(400).json({ error: 'Phone number and code are required' });
  }

  try {
    const result = await twilioClient.verify.v2
      .services(verifySid)
      .verificationChecks
      .create({ to: phoneNumber, code });

    res.json({ status: result.status, valid: result.status === 'approved' });
  } catch (error) {
    console.error('Twilio verify/check error:', error);
    res.status(500).json({ error: 'Failed to check verification code' });
  }
});

/**
 * === Twilio Lookup: Check if number is valid & mobile ===
 */
app.post('/verify/lookup', async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  try {
    const lookup = await twilioClient.lookups.v2
      .phoneNumbers(phoneNumber)
      .fetch({ type: ['carrier'] });

    const isMobile = lookup.carrier?.type === 'mobile';

    res.json({
      valid: true,
      number: lookup.phoneNumber,
      carrierType: lookup.carrier?.type || 'unknown',
      isMobile
    });
  } catch (error) {
    console.error('Twilio lookup error:', error?.message || error);
    res.json({
      valid: false,
      number: phoneNumber,
      carrierType: 'invalid',
      isMobile: false
    });
  }
});

/**
 * === Health Check ===
 */
app.get('/', (req, res) => {
  res.send('API is up and running!');
});

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
