import React, { useState } from 'react';
import Papa from 'papaparse';
import './CSVUpload.css';

const stateMap = {
  'Alabama': 'AL',
  'Alaska': 'AK',
  'Arizona': 'AZ',
  'Arkansas': 'AR',
  'California': 'CA',
  'Colorado': 'CO',
  'Connecticut': 'CT',
  'Delaware': 'DE',
  'Florida': 'FL',
  'Georgia': 'GA',
  'Hawaii': 'HI',
  'Idaho': 'ID',
  'Illinois': 'IL',
  'Indiana': 'IN',
  'Iowa': 'IA',
  'Kansas': 'KS',
  'Kentucky': 'KY',
  'Louisiana': 'LA',
  'Maine': 'ME',
  'Maryland': 'MD',
  'Massachusetts': 'MA',
  'Michigan': 'MI',
  'Minnesota': 'MN',
  'Mississippi': 'MS',
  'Missouri': 'MO',
  'Montana': 'MT',
  'Nebraska': 'NE',
  'Nevada': 'NV',
  'New Hampshire': 'NH',
  'New Jersey': 'NJ',
  'New Mexico': 'NM',
  'New York': 'NY',
  'North Carolina': 'NC',
  'North Dakota': 'ND',
  'Ohio': 'OH',
  'Oklahoma': 'OK',
  'Oregon': 'OR',
  'Pennsylvania': 'PA',
  'Rhode Island': 'RI',
  'South Carolina': 'SC',
  'South Dakota': 'SD',
  'Tennessee': 'TN',
  'Texas': 'TX',
  'Utah': 'UT',
  'Vermont': 'VT',
  'Virginia': 'VA',
  'Washington': 'WA',
  'West Virginia': 'WV',
  'Wisconsin': 'WI',
  'Wyoming': 'WY',
  'District of Columbia': 'DC'
};

const normalizeState = (input) => {
  const trimmed = input?.trim();
  if (!trimmed) return '';
  return stateMap[trimmed] || trimmed; // fallback to original input if already abbreviated or unknown
};


const CSVUpload = ({ onLookupResults }) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [results, setResults] = useState([]);



Papa.parse(file, {
  header: true,
  skipEmptyLines: true,
  transformHeader: (header) => header.trim().toLowerCase(), // sanitize headers
  complete: async (result) => {
    const rows = result.data;
    const limitedRows = rows.slice(0, 75);
    const newResults = [];
    const errorList = [];

    setLoading(true);

    for (let row of limitedRows) {
      const street = row['address']?.trim() || '';
      const city = row['city']?.trim() || '';
      const state = normalizeState(row['state'] || '');
      const zip = row['zip']?.trim() || '';
      const name = row['name']?.trim() || 'N/A';

      const fullAddress = [street, city, state, zip].filter(Boolean).join(', ');

      if (!fullAddress) {
        errorList.push(`Incomplete address: "${street || 'Missing'}"`);
        continue;
      }

      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/lookup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: fullAddress })
        });

        const data = await res.json();

        newResults.push({
          input: fullAddress,
          owner: data.responses?.[0]?.owner?.firstName
            ? `${data.responses[0].owner.firstName} ${data.responses[0].owner.lastName}`
            : name,
          phoneNumbers: data.responses?.[0]?.phoneNumbers || [],
          raw: data
        });
      } catch (err) {
        errorList.push(`Error for address "${fullAddress}": ${err.message}`);
      }
    }

    setLoading(false);
    setResults(newResults);
    setErrors(errorList);
    onLookupResults(newResults);
  }
});



  return (
    <div className="csv-upload-container">
      <h3>📁 Upload CSV</h3>
      <input type="file" accept=".csv" onChange={handleFileUpload} />
      {loading && <p>Looking up addresses...</p>}
      {errors.length > 0 && (
        <div className="csv-upload-errors">
          <h4>Errors:</h4>
          <ul>{errors.map((err, i) => <li key={i}>{err}</li>)}</ul>
        </div>
      )}
    </div>
  );
};

export default CSVUpload;
