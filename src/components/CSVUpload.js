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
          let address = row["Address"]?.trim();

          if (!address) {
            const values = Object.values(row).filter(Boolean);
            address = values.join(', ').trim();
          }

          
          if (!address) {
          errorList.push(`Missing address field`);
          continue;
          }
         


          try {
            const res = await fetch(`${process.env.REACT_APP_API_URL}/lookup`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ address })
            });

            const data = await res.json();

            newResults.push({
              input: address,
              result: data,
              landglideOwner: row["Owner"] || "N/A"
            });
          } catch (err) {
            errorList.push(`Error for address "${address}": ${err.message}`);
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
