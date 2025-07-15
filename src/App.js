import React, { useState } from 'react';
import './App.css';
import { LoadScript, Autocomplete } from '@react-google-maps/api';

const libraries = ['places'];
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

function App() {
  const [autocomplete, setAutocomplete] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [result, setResult] = useState(null);

  const handlePlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      setInputValue(place.formatted_address);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:5000/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: inputValue })
      });

      const data = await response.json();
      setResult(data);
      console.log(data);
    } catch (err) {
      console.error('Frontend fetch error:', err);
    }
  };

  return (
    <div className="App">
      <h1>Property Lookup</h1>
      <LoadScript
        googleMapsApiKey={GOOGLE_MAPS_API_KEY}
        libraries={libraries}
      >
        <form onSubmit={handleSubmit}>
          <Autocomplete
            onLoad={(autoC) => setAutocomplete(autoC)}
            onPlaceChanged={handlePlaceChanged}
          >
            <input
              type="text"
              placeholder="Enter a property address"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              style={{ width: '300px', padding: '8px' }}
            />
          </Autocomplete>
          <button type="submit">Lookup</button>
        </form>
      </LoadScript>

      {result && (
        <pre>{JSON.stringify(result, null, 2)}</pre>
      )}
    </div>
  );
}

export default App;
