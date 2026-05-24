import { useState, useEffect } from 'react';
import { GoogleMap, DirectionsRenderer, Marker } from '@react-google-maps/api';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '8px'
};

// Default coordinates (Guatemala City)
const defaultCenter = {
  lat: 14.6038,
  lng: -90.4893
};

export default function MapComponent({ routeData, locations }) {
  const [directions, setDirections] = useState(null);

  useEffect(() => {
    // Prevent execution if we don't have the solved route or the location coordinates yet
    if (!routeData || !routeData.route || !locations || locations.length === 0) return;

    const orderedIds = routeData.route.ordered_locations;
    
    // Map the ordered IDs returned by the Genetic Algorithm back to their coordinates
    const orderedCoordinates = orderedIds.map(id => {
      return locations.find(loc => loc.id === id);
    }).filter(Boolean); // Filter out undefined values just in case

    if (orderedCoordinates.length < 2) return;

    // Define origin and destination based on the sorted array
    const origin = { lat: orderedCoordinates[0].lat, lng: orderedCoordinates[0].lng };
    const destination = {
      lat: orderedCoordinates[orderedCoordinates.length - 1].lat,
      lng: orderedCoordinates[orderedCoordinates.length - 1].lng
    };

    // The remaining points in between become waypoints
    const waypoints = orderedCoordinates.slice(1, -1).map(loc => ({
      location: { lat: loc.lat, lng: loc.lng },
      stopover: true
    }));

    // Call the Google Maps Directions API to draw the roads
    const directionsService = new window.google.maps.DirectionsService();

    directionsService.route(
      {
        origin: origin,
        destination: destination,
        waypoints: waypoints,
        travelMode: window.google.maps.TravelMode.DRIVING,
        // We set optimizeWaypoints to false because our Genetic Algorithm already did the heavy lifting!
        optimizeWaypoints: false, 
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirections(result);
        } else {
          console.error(`Error fetching directions: ${status}`);
        }
      }
    );

  }, [routeData, locations]);

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      zoom={12}
      center={defaultCenter}
      options={{
        disableDefaultUI: true, 
        zoomControl: true,      
      }}
    >
      {/* If the algorithm returned a route, draw the driving directions */}
      {directions && (
        <DirectionsRenderer
          directions={directions}
          options={{
            polylineOptions: {
              strokeColor: '#006EAF',
              strokeWeight: 5,
              strokeOpacity: 0.8
            }
          }}
        />
      )}

      {/* If we only have locations but no directions yet, just show individual pins */}
      {!directions && locations && locations.map((loc) => (
        <Marker key={loc.id} position={{ lat: loc.lat, lng: loc.lng }} />
      ))}
    </GoogleMap>
  );
}