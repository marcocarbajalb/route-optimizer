import { useState, useRef } from 'react';
import { Autocomplete } from '@react-google-maps/api';
import { findDestinationsOverRadius, MAX_RADIUS_KM } from '../utils/distance';

export default function DestinationForm({ onSubmit, isLoading }) {
  const [destinations, setDestinations] = useState([
    { id: 'dest-1', value: '', lat: null, lng: null },
    { id: 'dest-2', value: '', lat: null, lng: null }
  ]);

  const [isClosedRoute, setIsClosedRoute] = useState(true);

  // Validation feedback state.
  const [errorMessage, setErrorMessage] = useState(null);
  const [invalidIds, setInvalidIds] = useState(new Set());

  const autocompleteRefs = useRef({});

  // Clears validation feedback tied to a single destination (used when the
  // user edits, picks a new place, or removes a flagged destination).
  const clearValidationFor = (id) => {
    setErrorMessage(null);
    setInvalidIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleAddDestination = () => {
    if (destinations.length < 15) {
      setDestinations([...destinations, { id: `dest-${Date.now()}`, value: '', lat: null, lng: null }]);
    }
  };

  const handleRemoveDestination = (idToRemove) => {
    if (destinations.length > 2) {
      setDestinations(destinations.filter((dest) => dest.id !== idToRemove));
      delete autocompleteRefs.current[idToRemove];
      clearValidationFor(idToRemove);
    }
  };

  // Handles manual text input or deletion.
  const handleChange = (id, newValue) => {
    setDestinations(destinations.map((dest) =>
      // Invalidate lat/lng on manual input to force selection from the list.
      dest.id === id ? { ...dest, value: newValue, lat: null, lng: null } : dest
    ));
    clearValidationFor(id);
  };

  // Triggered when the user selects an option from the Google Places list.
  const handlePlaceChanged = (id) => {
    const autocomplete = autocompleteRefs.current[id];
    if (autocomplete) {
      const place = autocomplete.getPlace();

      if (place && place.geometry && place.geometry.location) {
        setDestinations((prev) => prev.map((dest) =>
          dest.id === id ? {
            ...dest,
            value: place.name || place.formatted_address,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          } : dest
        ));
        clearValidationFor(id);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setInvalidIds(new Set());

    const geocoder = new window.google.maps.Geocoder();
    const failedIds = new Set();
    const errors = [];

    const resolvedDestinations = await Promise.all(
      destinations.map(async (dest) => {
        // 1. If it already has coordinates, return it as is.
        if (dest.lat !== null && dest.lng !== null) {
          return dest;
        }

        // 2. Skip if the field is empty (the browser "required" handles this).
        if (!dest.value.trim()) return dest;

        // 3. Fallback: request coordinates from the Geocoding API.
        try {
          const response = await geocoder.geocode({
            address: dest.value,
            componentRestrictions: { country: 'gt' }
          });

          if (response.results && response.results.length > 0) {
            const bestMatch = response.results[0];

            // Prevent Google from returning the entire country for gibberish.
            if (bestMatch.types.includes('country')) {
              errors.push(`No specific coordinates found for "${dest.value}".`);
              failedIds.add(dest.id);
              return dest;
            }

            return {
              ...dest,
              lat: bestMatch.geometry.location.lat(),
              lng: bestMatch.geometry.location.lng()
            };
          }

          errors.push(`No coordinates found for "${dest.value}".`);
          failedIds.add(dest.id);
          return dest;
        } catch (error) {
          console.error('Geocoding fallback error:', error);
          errors.push(`Error resolving address "${dest.value}".`);
          failedIds.add(dest.id);
          return dest;
        }
      })
    );

    // Persist resolved coordinates so we don't re-geocode on the next submit.
    setDestinations(resolvedDestinations);

    // Abort on any geocoding failure.
    if (failedIds.size > 0) {
      setInvalidIds(failedIds);
      setErrorMessage(`${errors.join(' ')} Please refine the highlighted destinations.`);
      return;
    }

    // Enforce the 100 km radius limit on the client before calling the API.
    const { invalidIds: overRadiusIds, worstPair } =
      findDestinationsOverRadius(resolvedDestinations);

    if (overRadiusIds.size > 0) {
      setInvalidIds(overRadiusIds);
      setErrorMessage(
        `"${worstPair.a.value}" and "${worstPair.b.value}" are ` +
          `${worstPair.distance.toFixed(1)} km apart, which exceeds the ` +
          `${MAX_RADIUS_KM} km limit. Adjust the highlighted destinations.`
      );
      return;
    }

    // All good: submit the fully resolved data to the parent.
    onSubmit({ destinations: resolvedDestinations, isClosedRoute });
  };

  return (
    <div style={{ backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '8px', width: '100%', boxSizing: 'border-box' }}>
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

        {/* Validation feedback (geocoding failures or 100 km radius breaches) */}
        {errorMessage && (
          <div
            role="alert"
            style={{
              padding: '10px 12px',
              backgroundColor: '#fdecea',
              border: '1px solid #f5c2c0',
              borderRadius: '4px',
              color: '#a4291f',
              fontSize: '14px',
              lineHeight: '1.4'
            }}
          >
            {errorMessage}
          </div>
        )}

        {destinations.map((dest, index) => {
          const isInvalid = invalidIds.has(dest.id);
          return (
            <div key={dest.id} style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <Autocomplete
                  onLoad={(ref) => (autocompleteRefs.current[dest.id] = ref)}
                  onPlaceChanged={() => handlePlaceChanged(dest.id)}
                  options={{ componentRestrictions: { country: 'gt' } }}
                >
                  <input
                    type="text"
                    placeholder={`Destination ${index + 1}`}
                    value={dest.value}
                    onChange={(e) => handleChange(dest.id, e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '8px',
                      boxSizing: 'border-box',
                      border: isInvalid ? '2px solid #ff4d4d' : '1px solid #ccc',
                      outline: 'none'
                    }}
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
          );
        })}

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