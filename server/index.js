require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

console.log(PORT);


app.use(cors());
app.use(express.json());

app.post('/lookup', (req, res) => {
  const { address } = req.body;
  console.log('Received lookup for:', address);
  res.json({ message: `Simulated phone lookup for: ${address}` });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
