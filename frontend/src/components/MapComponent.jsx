import { useState, useEffect } from 'react';
import { GoogleMap, DirectionsRenderer, Marker } from '@react-google-maps/api';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '8px'
};

const defaultCenter = {
  lat: 14.6038,
  lng: -90.4893
};

const COLOR_DEFAULT = '#EA4335';
const COLOR_START_END = '#EA4335';

// Builds an SVG teardrop pin icon with an embedded number label.
// For closed-route origin pins, adds a divider and "S/E" subtitle
// to make clear the pin is both the start and the end of the route.
function createPinIcon(number, isStartEnd) {
  const color = isStartEnd ? COLOR_START_END : COLOR_DEFAULT;

  const svg = isStartEnd
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="46" viewBox="0 0 32 46">
        <path d="M16 0 C7.163 0 0 7.163 0 16 C0 27 16 46 16 46 C16 46 32 27 32 16 C32 7.163 24.837 0 16 0Z" fill="${color}" stroke="white" stroke-width="2"/>
        <text x="16" y="13" text-anchor="middle" dominant-baseline="middle" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="white">${number}</text>
        <line x1="8" y1="19" x2="24" y2="19" stroke="rgba(255,255,255,0.7)" stroke-width="1"/>
        <text x="16" y="26" text-anchor="middle" dominant-baseline="middle" font-family="Arial,sans-serif" font-size="7.5" fill="white">S/E</text>
      </svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
        <path d="M14 0 C6.268 0 0 6.268 0 14 C0 23.5 14 40 14 40 C14 40 28 23.5 28 14 C28 6.268 21.732 0 14 0Z" fill="${color}" stroke="white" stroke-width="2"/>
        <text x="14" y="15" text-anchor="middle" dominant-baseline="middle" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="white">${number}</text>
      </svg>`;

  const width = isStartEnd ? 32 : 28;
  const height = isStartEnd ? 46 : 40;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new window.google.maps.Size(width, height),
    // Anchor at the tip of the teardrop so it points to the exact location.
    anchor: new window.google.maps.Point(width / 2, height),
  };
}

export default function MapComponent({ routeData, locations }) {
  const [directions, setDirections] = useState(null);
  const [numberedStops, setNumberedStops] = useState([]);
  const [isClosedRoute, setIsClosedRoute] = useState(false);

  useEffect(() => {
    if (!routeData || !routeData.route || !locations || locations.length === 0) {
      setDirections(null);
      setNumberedStops([]);
      return;
    }

    const orderedIds = routeData.route.ordered_locations;

    const orderedCoordinates = orderedIds
      .map(id => locations.find(loc => loc.id === id))
      .filter(Boolean);

    if (orderedCoordinates.length < 2) return;

    // The backend appends the origin ID at the end for closed routes.
    const closed = orderedIds[0] === orderedIds[orderedIds.length - 1];
    setIsClosedRoute(closed);

    // Strip the closing duplicate so we don't render an overlapping pin.
    const uniqueStops = closed ? orderedCoordinates.slice(0, -1) : orderedCoordinates;
    setNumberedStops(uniqueStops);

    const origin = { lat: orderedCoordinates[0].lat, lng: orderedCoordinates[0].lng };
    const destination = {
      lat: orderedCoordinates[orderedCoordinates.length - 1].lat,
      lng: orderedCoordinates[orderedCoordinates.length - 1].lng,
    };

    const waypoints = orderedCoordinates.slice(1, -1).map(loc => ({
      location: { lat: loc.lat, lng: loc.lng },
      stopover: true,
    }));

    const directionsService = new window.google.maps.DirectionsService();

    directionsService.route(
      {
        origin,
        destination,
        waypoints,
        travelMode: window.google.maps.TravelMode.DRIVING,
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
      {directions && (
        <>
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: '#006EAF',
                strokeWeight: 5,
                strokeOpacity: 0.8,
              },
            }}
          />
          {numberedStops.map((loc, index) => (
            <Marker
              key={loc.id}
              position={{ lat: loc.lat, lng: loc.lng }}
              icon={createPinIcon(index + 1, isClosedRoute && index === 0)}
            />
          ))}
        </>
      )}

      {/* Pre-optimization: show plain pins for entered destinations */}
      {!directions && locations && locations.map((loc) => (
        <Marker key={loc.id} position={{ lat: loc.lat, lng: loc.lng }} />
      ))}
    </GoogleMap>
  );
}