import React, { useState } from 'react';
import Papa from 'papaparse';
import './CSVUpload.css';

const CSVUpload = ({ onLookupResults }) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [results, setResults] = useState([]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (result) => {
        const rows = result.data;
        const limitedRows = rows.slice(0, 10);
        const newResults = [];
        const errorList = [];

        setLoading(true);

        for (let row of limitedRows) {
          const street = row['Address']?.trim();
          const city = row['City']?.trim();
          const state = row['State']?.trim();
          const zip = row['Zip']?.trim();

          const fullAddress = [street, city, state, zip].filter(Boolean).join(', ');

          if (!fullAddress) {
            errorList.push(`Incomplete address: "${row['Address'] || 'Missing'}"`);
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
              landglideOwner: row['Owner'] || 'N/A',
              result: data
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
  };

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
