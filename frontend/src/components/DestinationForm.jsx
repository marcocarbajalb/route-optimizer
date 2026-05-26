import { useState, useRef } from 'react';
import { Autocomplete } from '@react-google-maps/api';

export default function DestinationForm({ onSubmit, isLoading }) {
  // State now stores lat and lng as null initially
  const [destinations, setDestinations] = useState([
    { id: 'dest-1', value: '', lat: null, lng: null },
    { id: 'dest-2', value: '', lat: null, lng: null }
  ]);
  
  const [isClosedRoute, setIsClosedRoute] = useState(true);
  
  // Use useRef to keep track of Autocomplete instances
  const autocompleteRefs = useRef({});

  const handleAddDestination = () => {
    if (destinations.length < 15) {
      setDestinations([...destinations, { id: `dest-${Date.now()}`, value: '', lat: null, lng: null }]);
    }
  };

  const handleRemoveDestination = (idToRemove) => {
    if (destinations.length > 2) {
      setDestinations(destinations.filter(dest => dest.id !== idToRemove));
      // Clear the reference to prevent memory leaks
      delete autocompleteRefs.current[idToRemove];
    }
  };

  // Handles manual text input or deletion
  const handleChange = (id, newValue) => {
    setDestinations(destinations.map(dest => 
      // Invalidate lat/lng on manual input to force selection from the dropdown list
      dest.id === id ? { ...dest, value: newValue, lat: null, lng: null } : dest
    ));
  };

  // Triggered when the user selects an option from the Google Places list
  const handlePlaceChanged = (id) => {
    const autocomplete = autocompleteRefs.current[id];
    if (autocomplete) {
      const place = autocomplete.getPlace();
      
      if (place && place.geometry && place.geometry.location) {
        setDestinations(prev => prev.map(dest => 
          dest.id === id ? { 
            ...dest, 
            value: place.name || place.formatted_address,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          } : dest
        ));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const geocoder = new window.google.maps.Geocoder();
    let hasGeocodingError = false;

    const resolvedDestinations = await Promise.all(
      destinations.map(async (dest) => {
        // 1. If it already has coordinates, return it as is
        if (dest.lat !== null && dest.lng !== null) {
          return dest;
        }

        // 2. Skip if the field is empty
        if (!dest.value.trim()) return dest;

        // 3. Fallback: Request coordinates from Google Geocoding API
        try {
          const response = await geocoder.geocode({
            address: dest.value,
            componentRestrictions: { country: "gt" }
          });

          if (response.results && response.results.length > 0) {
            const bestMatch = response.results[0];
            
            // Prevent Google from returning the entire country for gibberish text
            if (bestMatch.types.includes("country")) {
              alert(`No specific coordinates found for: "${dest.value}". Please be more specific.`);
              hasGeocodingError = true;
              return dest;
            }

            return {
              ...dest,
              lat: bestMatch.geometry.location.lat(),
              lng: bestMatch.geometry.location.lng()
            };
          } else {
            alert(`No coordinates found for: "${dest.value}". Please try to be more specific.`);
            hasGeocodingError = true;
            return dest;
          }
        } catch (error) {
          console.error("Geocoding fallback error:", error);
          alert(`Error searching for address: "${dest.value}".`);
          hasGeocodingError = true;
          return dest;
        }
      })
    );

    if (hasGeocodingError) return;

    // Update the form state preserving the custom text inputs
    setDestinations(resolvedDestinations);

    // Submit the fully resolved data to the parent component (App.jsx -> FastAPI)
    onSubmit({ destinations: resolvedDestinations, isClosedRoute });
  };

  return (
    <div style={{ backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '8px', width: '100%', boxSizing: 'border-box'}}>
      <h2 style={{ marginTop: 0 }}>Plan Your Route</h2>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        <div style={{ display: 'flex', gap: '15px', paddingBottom: '10px', borderBottom: '1px solid #ddd' }}>
          <label>
            <input 
              type="radio" 
              checked={isClosedRoute} 
              onChange={() => setIsClosedRoute(true)} 
            /> Closed Route
          </label>
          <label>
            <input 
              type="radio" 
              checked={!isClosedRoute} 
              onChange={() => setIsClosedRoute(false)} 
            /> Open Route
          </label>
        </div>

        {destinations.map((dest, index) => (
          <div key={dest.id} style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <Autocomplete
                onLoad={(ref) => autocompleteRefs.current[dest.id] = ref}
                onPlaceChanged={() => handlePlaceChanged(dest.id)}
                options={{ componentRestrictions: { country: "gt" } }}
              >
                <input
                  type="text"
                  placeholder={`Destination ${index + 1}`}
                  value={dest.value}
                  onChange={(e) => handleChange(dest.id, e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                />
              </Autocomplete>
            </div>
            
            {destinations.length > 2 && (
              <button 
                type="button" 
                onClick={() => handleRemoveDestination(dest.id)}
                style={{ padding: '8px', backgroundColor: '#ff4d4d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                X
              </button>
            )}
          </div>
        ))}

        {destinations.length < 15 && (
          <button 
            type="button" 
            onClick={handleAddDestination}
            style={{ padding: '8px', backgroundColor: '#e0e0e0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            + Add Destination
          </button>
        )}

        <button 
          type="submit" 
          disabled={isLoading}
          style={{ padding: '12px', backgroundColor: '#006EAF', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px', fontSize: '16px' }}
        >
          {isLoading ? 'Calculating...' : 'Optimize Route'}
        </button>
      </form>
    </div>
  );
}