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
  const [copiedField, setCopiedField] = useState(null);

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
      console.log(data);
    } catch (err) {
      console.error('Frontend fetch error:', err);
    } finally {
      setLoading(false);
    }
  };


const getValidationLabel = (validation) => {
  if (!validation) return null;

  const { valid, carrier, line_type, country, raw } = validation;

  return (
    <>
      <strong>{valid ? '✅ Likely Good Number' : '❌ Invalid Number'}</strong><br />
      📶 <strong>Carrier:</strong> {carrier || 'N/A'}<br />
      🏙️ <strong>Location:</strong> {raw?.PhoneBasic?.PhoneLocation || 'N/A'}<br />
      📞 <strong>Type:</strong> {line_type || 'N/A'}<br />
      🌍 <strong>Country:</strong> {country || 'N/A'}
    </>
  );
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


<p>
  <strong>Owner Name:</strong> {result.results.persons[0].name?.full || 'N/A'}
  {result.results.persons[0].name?.full && (
    <button
      onClick={() =>
        copyToClipboard(result.results.persons[0].name.full, 'owner')
      }
      style={{
        marginLeft: '8px',
        cursor: 'pointer',
        background: 'none',
        border: 'none',
        fontSize: '1rem'
      }}
      title="Copy Owner Name"
    >
      📋
    </button>
  )}
  {copiedField === 'owner' && (
    <span style={{ marginLeft: '6px', fontSize: '0.85rem', color: 'limegreen' }}>
      Copied!
    </span>
  )}
</p>


<p>
  <strong>Property Address:</strong>{' '}
  {[
    result.results.persons[0].propertyAddress?.street,
    result.results.persons[0].propertyAddress?.city,
    result.results.persons[0].propertyAddress?.state,
    result.results.persons[0].propertyAddress?.zip
  ].filter(Boolean).join(', ')}

  {result.results.persons[0].propertyAddress?.city &&
    result.results.persons[0].propertyAddress?.state && (
      <button
        onClick={() =>
          copyToClipboard(
            `${result.results.persons[0].propertyAddress.city}, ${result.results.persons[0].propertyAddress.state}`,
            'citystate'
          )
        }
        style={{
          marginLeft: '8px',
          cursor: 'pointer',
          background: 'none',
          border: 'none',
          fontSize: '1rem'
        }}
        title="Copy City & State"
      >
        📋
      </button>
  )}

  {copiedField === 'citystate' && (
    <span style={{ marginLeft: '6px', fontSize: '0.85rem', color: 'limegreen' }}>Copied!</span>
  )}
</p>




          <h3>📞 Phone Numbers:</h3>


          <ul>         
  {result.results.persons[0].phoneNumbers?.length > 0 ? (
  result.results.persons[0].phoneNumbers.map((phone, index) => (
   <li key={index} style={{ marginBottom: '1.5em' }}>
  {formatPhoneNumber(phone.number)} ({phone.type}, Score: {phone.score})<br />
<div style={{ marginTop: '6px', marginBottom: '16px' }}>
  {getValidationLabel(phone.validation)}
</div>
                </li>

  ))
) : (
  <li>No phone numbers found</li>
)}
        </ul>


<h3>🏢 Owner Mailing Address:</h3>
<p>
  <>
    {result.results.persons[0].property?.owner?.name?.full}
    {result.results.persons[0].property?.owner?.name?.full && (
      <button
        onClick={() =>
          copyToClipboard(result.results.persons[0].property.owner.name.full, 'company')
        }
        style={{ marginLeft: '8px', cursor: 'pointer', background: 'none', border: 'none' }}
        title="Copy Company Name"
      >
        📋
      </button>
    )}
    {copiedField === 'company' && (
      <span style={{ marginLeft: '6px', fontSize: '0.85rem', color: 'limegreen' }}>
        Copied!
      </span>
    )}
  </>
  <br />
  {[
    result.results.persons[0].property?.owner?.mailingAddress?.street,
    result.results.persons[0].property?.owner?.mailingAddress?.city,
    result.results.persons[0].property?.owner?.mailingAddress?.state,
    result.results.persons[0].property?.owner?.mailingAddress?.zip
  ].filter(Boolean).join(', ')}

  {/* Copy city + state */}
  {result.results.persons[0].property?.owner?.mailingAddress?.city &&
   result.results.persons[0].property?.owner?.mailingAddress?.state && (
    <>
      <button
        onClick={() =>
          copyToClipboard(
            `${result.results.persons[0].property.owner.mailingAddress.city}, ${result.results.persons[0].property.owner.mailingAddress.state}`,
            'citystate'
          )
        }
        style={{ marginLeft: '8px', cursor: 'pointer', background: 'none', border: 'none' }}
        title="Copy City & State"
      >
        📋
      </button>
      {copiedField === 'citystate' && (
        <span style={{ marginLeft: '6px', fontSize: '0.85rem', color: 'limegreen' }}>
          Copied!
        </span>
      )}
    </>
  )}
</p>





        </div>
      )}
    </div>
  );
}

export default App;
