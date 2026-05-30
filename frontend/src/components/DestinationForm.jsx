import { useState, useRef } from 'react';
import { Autocomplete } from '@react-google-maps/api';
import { findDestinationsOverRadius, MAX_RADIUS_KM } from '../utils/distance';

// Address component types that carry useful "city / zone" context, in order
// of preference. We pick the first one present to keep the label concise.
const CONTEXT_TYPES = [
  'sublocality',
  'sublocality_level_1',
  'locality',
  'administrative_area_level_2',
  'administrative_area_level_1',
];

/**
 * Extracts a single concise context string (zone or city) from a place's
 * address components, e.g. "Zona 16" or "Ciudad de Guatemala".
 */
function extractContext(addressComponents = []) {
  for (const type of CONTEXT_TYPES) {
    const match = addressComponents.find((c) => c.types.includes(type));
    if (match) return match.long_name;
  }
  return null;
}

/**
 * Builds a readable, distinguishable label for a place picked from the list.
 *
 * Goal: "Name; City/Zone" so the final list is unambiguous.
 * - If the place name is already part of the address (e.g. a street), the
 *   name would just duplicate the address, so we show the address alone.
 * - Otherwise we append a single context fragment (zone/city) to the name.
 */
function buildLocationLabel(place) {
  const name = place.name?.trim();
  const address = place.formatted_address?.trim();

  // No name at all: fall back to the formatted address.
  if (!name) return address || '';

  // No address to enrich with: use the bare name.
  if (!address) return name;

  // The name is already contained in the address (typical for streets, where
  // name === address line). Showing both would be redundant, so prefer the
  // address, which carries more context.
  if (address.toLowerCase().startsWith(name.toLowerCase())) {
    return address;
  }

  // Append a single concise context fragment (zone/city) when available.
  const context = extractContext(place.address_components);
  return context ? `${name}; ${context}` : name;
}

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

  // Clears validation feedback tied to a single destination.
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
            value: buildLocationLabel(place),
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
              // Keep the user's own text as the label; Google is only used to
              // resolve coordinates here. This avoids replacing a typed name
              // like "Cayalá" with a cryptic plus code / "Unnamed Road".
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
    <form className="form" onSubmit={handleSubmit}>
      <span className="form-title">Plan your route</span>

      {/* Route mode (closed / open) */}
      <div className="segmented" role="radiogroup" aria-label="Route mode">
        <label className="segmented__option">
          <input
            className="sr-only"
            type="radio"
            name="route-mode"
            checked={isClosedRoute}
            onChange={() => setIsClosedRoute(true)}
          />
          Closed route
        </label>
        <label className="segmented__option">
          <input
            className="sr-only"
            type="radio"
            name="route-mode"
            checked={!isClosedRoute}
            onChange={() => setIsClosedRoute(false)}
          />
          Open route
        </label>
      </div>

      {/* Validation feedback (geocoding failures or 100 km radius breaches) */}
      {errorMessage && (
        <div className="alert" role="alert">{errorMessage}</div>
      )}

      {destinations.map((dest, index) => (
        <div key={dest.id} className="dest-row">
          <Autocomplete
            onLoad={(ref) => (autocompleteRefs.current[dest.id] = ref)}
            onPlaceChanged={() => handlePlaceChanged(dest.id)}
            options={{ componentRestrictions: { country: 'gt' } }}
          >
            <input
              type="text"
              className={`field${invalidIds.has(dest.id) ? ' field--invalid' : ''}`}
              placeholder={`Destination ${index + 1}`}
              value={dest.value}
              onChange={(e) => handleChange(dest.id, e.target.value)}
              required
            />
          </Autocomplete>

          {destinations.length > 2 && (
            <button
              type="button"
              className="btn-remove"
              onClick={() => handleRemoveDestination(dest.id)}
              aria-label={`Remove destination ${index + 1}`}
            >
              ×
            </button>
          )}
        </div>
      ))}

      {destinations.length < 15 && (
        <button type="button" className="btn-add" onClick={handleAddDestination}>
          + Add destination
        </button>
      )}

      <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
        {isLoading ? 'Calculating…' : 'Optimize route'}
      </button>
    </form>
  );
}