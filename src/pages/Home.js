import React, { useState } from 'react';
import { Autocomplete } from '@react-google-maps/api';
import '../App.css';
import CSVUpload from '../components/CSVUpload';

function formatPhoneNumber(phone) {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

const Home = () => {
  const [autocomplete, setAutocomplete] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [csvResults, setCsvResults] = useState([]);

  const copyToClipboard = (text, fieldKey) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(fieldKey);
      setTimeout(() => setCopiedField(null), 1500);
    });
  };

  const handlePlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place?.formatted_address) {
        setInputValue(place.formatted_address);
      }
    }
  };

  const checkPhoneNumber = async (number) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/verify/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: number })
      });
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Lookup failed:', err);
      return { valid: false, disconnected: false, suspended: false, line_type: null };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    setLoading(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: inputValue })
      });

      const data = await response.json();

      if (data?.results?.persons?.[0]?.phoneNumbers?.length) {
        const lookups = await Promise.all(
          data.results.persons[0].phoneNumbers.map(async (phone) => {
            const info = await checkPhoneNumber(phone.number);
            return { ...phone, validation: info };
          })
        );
        data.results.persons[0].phoneNumbers = lookups;
      }

      setResult(data);
    } catch (err) {
      console.error('Frontend fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getValidationLabel = (validation) => {
    if (!validation) return null;
    const { carrier, line_type, raw } = validation;

    return (
      <>
        📶 <strong>Carrier:</strong> {carrier || 'N/A'}<br />
        🏙️ <strong>Location:</strong> {raw?.PhoneBasic?.PhoneLocation || 'N/A'}<br />
        📞 <strong>Type:</strong> {line_type || 'N/A'}<br />
      </>
    );
  };

  return (
    <div className="page-container">
      <h1>Property Lookup</h1>


<div className="card">
  <Autocomplete
    onLoad={(autoC) => setAutocomplete(autoC)}
    onPlaceChanged={handlePlaceChanged}
  >
    <input
      type="text"
      placeholder="Enter a property address"
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
    />
  </Autocomplete>

  <p className="helper-message">
    Google Maps Autocomplete enabled
  </p>

  <button onClick={handleSubmit} disabled={loading}>
    {loading ? "Looking up..." : "Lookup"}
  </button>
</div>




      {/* CSV Upload */}
      <div className="card csv-upload-container">
        <CSVUpload
          onLookupResults={(results) => {
            if (results.length > 10) {
              alert("Please upload no more than 10 addresses at a time.");
              return;
            }
            setCsvResults(results);
          }}
        />
      </div>

      {loading && <div className="progress-bar"></div>}

      {/* Single Lookup Result */}
      {(!loading && result && result.results?.persons?.length > 0) && (
        <div className="result-box" style={{ marginTop: '2rem', paddingBottom: '1rem', borderBottom: '2px solid #334155' }}>
          <h2>🔍 Property Lookup Results</h2>
          <p>
            <strong>Owner Name:</strong> {result.results.persons[0].name?.full || 'N/A'}
          </p>
          <p>
            <strong>Property Address:</strong>{' '}
            {[
              result.results.persons[0].propertyAddress?.street,
              result.results.persons[0].propertyAddress?.city,
              result.results.persons[0].propertyAddress?.state,
              result.results.persons[0].propertyAddress?.zip
            ].filter(Boolean).join(', ') || 'N/A'}
          </p>
          <h4>📞 Phone Numbers:</h4>
          <ul>
            {result.results.persons[0].phoneNumbers?.length > 0 ? (
              result.results.persons[0].phoneNumbers.map((phone, idx) => (
                <li key={idx} style={{ marginBottom: '1em' }}>
                  {formatPhoneNumber(phone.number)} ({phone.type}, Score: {phone.score})<br />
                  <div style={{ marginTop: '6px' }}>{getValidationLabel(phone.validation)}</div>
                </li>
              ))
            ) : (
              <li>No phone numbers found</li>
            )}
          </ul>
        </div>
      )}

      {/* CSV Lookup Results */}
      {csvResults.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h2>📊 CSV Lookup Results</h2>
          {csvResults.map((entry, i) => (
            <div key={i} className="result-box" style={{ marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '2px solid #334155' }}>
              <h3>📍 Address: {entry.input}</h3>
              {entry.result?.results?.persons?.length > 0 ? (
                <>
                  <p>
                    <strong>Owner Name:</strong> {entry.result.results.persons[0].name?.full || 'N/A'}
                  </p>
                  <p>
                    <strong>Property Address:</strong>{' '}
                    {[
                      entry.result.results.persons[0].propertyAddress?.street,
                      entry.result.results.persons[0].propertyAddress?.city,
                      entry.result.results.persons[0].propertyAddress?.state,
                      entry.result.results.persons[0].propertyAddress?.zip
                    ].filter(Boolean).join(', ') || 'N/A'}
                  </p>
                  <h4>📞 Phone Numbers:</h4>
                  <ul>
                    {entry.result.results.persons[0].phoneNumbers?.length > 0 ? (
                      entry.result.results.persons[0].phoneNumbers.map((phone, idx) => (
                        <li key={idx} style={{ marginBottom: '1em' }}>
                          {formatPhoneNumber(phone.number)} ({phone.type}, Score: {phone.score})<br />
                          <div style={{ marginTop: '6px' }}>{getValidationLabel(phone.validation)}</div>
                        </li>
                      ))
                    ) : (
                      <li>No phone numbers found</li>
                    )}
                  </ul>
                </>
              ) : (
                <p>No person data found for this address.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
