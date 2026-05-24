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
      
      // Verify that the selected place has valid coordinates
      if (place.geometry && place.geometry.location) {
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
    
    // Initialize Geocoder for free-text fallback
    const geocoder = new window.google.maps.Geocoder();
    let updatedDestinations = [...destinations];
    let geocodeError = false;

    for (let i = 0; i < updatedDestinations.length; i++) {
      const dest = updatedDestinations[i];
      
      // If the destination has text but no coordinates (user didn't click a suggestion)
      if (dest.value && (dest.lat === null || dest.lng === null)) {
        try {
          // Append "Guatemala" to provide context for the search
          const results = await geocoder.geocode({ address: `${dest.value}, Guatemala` });
          
          if (results.results && results.results.length > 0) {
            const location = results.results[0].geometry.location;
            updatedDestinations[i].lat = location.lat();
            updatedDestinations[i].lng = location.lng();
            // We intentionally keep dest.value as typed by the user to display 
            // the short place name rather than overriding it with a long formatted address.
          } else {
            geocodeError = true;
          }
        } catch (error) {
          console.error("Error geocoding free text:", error);
          geocodeError = true;
        }
      }
    }

    // Validate that all fields have valid text and coordinates
    const isValid = updatedDestinations.every(d => d.value.trim() !== '' && d.lat !== null && d.lng !== null);
    if (!isValid || geocodeError) {
      alert("Could not find coordinates for some locations. Please be more specific.");
      return;
    }

    // If validation passes, update state and submit
    setDestinations(updatedDestinations);
    onSubmit({ destinations: updatedDestinations, isClosedRoute });
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