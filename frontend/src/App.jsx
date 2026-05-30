import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './services/firebase';
import { useLoadScript } from '@react-google-maps/api';
import { optimizeRoute } from './services/cloudFunction';

import Login from './components/Login';
import DestinationForm from './components/DestinationForm';
import MapComponent from './components/MapComponent';

// Constant outside the component to avoid unnecessary re-renders
const libraries = ['places'];

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // States to handle the API request and its response
  const [isCalculating, setIsCalculating] = useState(false);
  const [routeData, setRouteData] = useState(null);
  const [submittedLocations, setSubmittedLocations] = useState([]);
  const [requestError, setRequestError] = useState(null);

  // Load Google Maps script securely
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setRouteData(null); // Clear data on logout
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  // Handle the form submission and API call
  const handleOptimizeRoute = async (formData) => {
    if (!user) return;

    setIsCalculating(true);
    setRequestError(null);

    try {
      // 1. Get the Firebase ID token from the current user
      const token = await user.getIdToken();

      // 2. Build the payload for the Cloud Function
      const payload = {
        locations: formData.destinations.map((d) => ({
          id: d.id,
          name: d.value,
          lat: d.lat,
          lng: d.lng,
        })),
        config: {
          is_closed_route: formData.isClosedRoute,
        },
      };

      setSubmittedLocations(payload.locations);

      // 3. Call the deployed Cloud Function via the service layer
      const data = await optimizeRoute(payload, token);

      // 4. Save the result
      setRouteData(data);
    } catch (error) {
      // A failed run must never leave a stale route or freshly-set pins on the map.
      setRouteData(null);
      setSubmittedLocations([]);
      setRequestError(error.message);
    } finally {
      setIsCalculating(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;
  }

  if (loadError) {
    return <div style={{ textAlign: 'center', marginTop: '50px', color: 'red' }}>Error loading Google Maps. Check your API Key in the .env file.</div>;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Route Optimizer</h1>
        <div>
          <span style={{ marginRight: '15px' }}>{user.email}</span>
          <button onClick={handleLogout} style={{ padding: '5px 10px', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </header>

      <main style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Left Column: Form and Results */}
        <div style={{ flex: '0 0 380px', maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <DestinationForm
            onSubmit={handleOptimizeRoute}
            isLoading={isCalculating}
          />

          {/* Request-level error (auth, IP, backend radius fallback, network) */}
          {requestError && (
            <div
              role="alert"
              style={{
                padding: '10px 12px',
                backgroundColor: '#fdecea',
                border: '1px solid #f5c2c0',
                borderRadius: '8px',
                color: '#a4291f',
                fontSize: '14px',
                lineHeight: '1.4',
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              {requestError}
            </div>
          )}

          {/* Render Route Details if available */}
          {routeData && routeData.route && (
            <div style={{
              padding: '20px',
              backgroundColor: '#f0f8ff',
              borderRadius: '8px',
              border: '1px solid #cce5ff',
              textAlign: 'left',
              color: '#000',
              maxHeight: '350px',
              overflowY: 'auto',
              boxSizing: 'border-box',
              width: '100%'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '10px' }}>Optimization Results</h3>

              <p style={{ fontWeight: 'bold', fontSize: '18px', margin: '0 0 15px 0' }}>
                Total Distance: {routeData.route.total_distance_km} km
              </p>

              <ol style={{ paddingLeft: '20px', margin: 0, lineHeight: '1.6' }}>
                {routeData.route.ordered_locations.map((locId, index) => {
                  const loc = submittedLocations.find(l => l.id === locId);
                  return (
                    <li key={`${locId}-${index}`}>
                      {loc ? loc.name : locId}
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
        </div>

        {/* Right Column: Map */}
        <div style={{ flex: '1', minWidth: '0', height: '600px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ccc' }}>
          {!isLoaded ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eaeaea' }}>
              Loading map...
            </div>
          ) : (
            <MapComponent routeData={routeData} locations={submittedLocations} />
          )}
        </div>
      </main>
    </div>
  );
}