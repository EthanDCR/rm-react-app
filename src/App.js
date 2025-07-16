import React, { useState } from 'react';
import './App.css';
import { LoadScript, Autocomplete } from '@react-google-maps/api';

function formatPhoneNumber(phone) {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

const libraries = ['places'];
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

function App() {
  const [autocomplete, setAutocomplete] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

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
      return { valid: false, type: 'error' };
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

      // Check each phone number with Twilio Lookup
      if (data?.results?.persons?.[0]?.phoneNumbers?.length) {
        const lookups = await Promise.all(
          data.results.persons[0].phoneNumbers.map(async (phone) => {
            const info = await checkPhoneNumber(phone.number);
            return { ...phone, ...info };
          })
        );
        data.results.persons[0].phoneNumbers = lookups;
      }

      setResult(data);
      console.log(data);
    } catch (err) {
      console.error('Frontend fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>Property Lookup</h1>
      <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={libraries}>
        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
        >
          <Autocomplete
            onLoad={(autoC) => setAutocomplete(autoC)}
            onPlaceChanged={handlePlaceChanged}
          >
            <input
              type="text"
              placeholder="Enter a property address"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              style={{ width: '450px', padding: '10px', margin: 0 }}
            />
          </Autocomplete>

          <p style={{
            fontSize: '13px',
            color: 'rgba(50, 205, 50, 0.7)',
            margin: 0,
            fontWeight: 'bold',
            lineHeight: '1.2'
          }}>
            Google Maps Autocomplete is enabled
          </p>

          <button
            type="submit"
            disabled={loading}
            style={{ padding: '8px 16px', margin: 0 }}
          >
            {loading ? "Looking up..." : "Lookup"}
          </button>
        </form>
      </LoadScript>

      {loading && <div className="progress-bar"></div>}

      {(!loading && result && result.results?.persons?.length > 0) && (
        <div className="result-box">
          <h2>🔍 Property Lookup Results</h2>

          <p><strong>Owner Name:</strong> {result.results.persons[0].name?.full || 'N/A'}</p>

          <p><strong>Property Address:</strong> {[
            result.results.persons[0].propertyAddress?.street,
            result.results.persons[0].propertyAddress?.city,
            result.results.persons[0].propertyAddress?.state,
            result.results.persons[0].propertyAddress?.zip
          ].filter(Boolean).join(', ')}</p>

          <p><strong>County:</strong> {result.results.persons[0].propertyAddress?.county || 'N/A'}</p>

          <h3>📞 Phone Numbers:</h3>
          <ul>
            {result.results.persons[0].phoneNumbers?.length > 0 ? (
              result.results.persons[0].phoneNumbers.map((phone, index) => (
                <li key={index}>
                  {formatPhoneNumber(phone.number)} ({phone.type}, Score: {phone.score})<br />
                  {phone.valid
                    ? `✅ Valid (${phone.carrier?.type || phone.type})`
                    : `❌ Invalid or unknown`}
                </li>
              ))
            ) : (
              <li>No phone numbers found</li>
            )}
          </ul>

          <h3>🏢 Owner Mailing Address:</h3>
          <p>
            {result.results.persons[0].property?.owner?.name?.full}<br />
            {[
              result.results.persons[0].property?.owner?.mailingAddress?.street,
              result.results.persons[0].property?.owner?.mailingAddress?.city,
              result.results.persons[0].property?.owner?.mailingAddress?.state,
              result.results.persons[0].property?.owner?.mailingAddress?.zip
            ].filter(Boolean).join(', ')}
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
