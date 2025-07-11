import React, { useState } from 'react';
import './App.css';
import { LoadScript, Autocomplete } from '@react-google-maps/api';

function App() {
  const [address, setAddress] = useState('');
  const [autocomplete, setAutocomplete] = useState(null);
  const [result, setResult] = useState('');

  const handleLoad = (auto) => {
    setAutocomplete(auto);
  };

  const handlePlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      setAddress(place.formatted_address || '');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      const data = await res.json();
      setResult(data.message);
    } catch (error) {
      setResult('Error contacting server');
    }
  };

  return (
    <div className="App">
      <h2>🔍 Find Phone Numbers</h2>
      <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY} libraries={['places']}>
        <form onSubmit={handleSubmit}>
          <Autocomplete onLoad={handleLoad} onPlaceChanged={handlePlaceChanged}>
            <input
              type="text"
              placeholder="Start typing an address..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </Autocomplete>  
          <div className="helper-message">Google Maps Autocomplete Enabled</div>
          <button type="submit">Find Phone Numbers</button>
        </form>
      </LoadScript>
      <p>{result}</p>
    </div>
  );
}

export default App;
