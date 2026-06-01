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

  // Bumping this key remounts DestinationForm, resetting its internal state
  // (typed destinations, route mode) back to defaults — a soft "refresh".
  const [formKey, setFormKey] = useState(0);

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

  // Clears the map (route + pins) and any request-level error. Used both by the
  // explicit reset button and when the form aborts on a validation error, so a
  // stale route is never left on the map next to a fresh error message.
  const clearMap = () => {
    setRouteData(null);
    setSubmittedLocations([]);
    setRequestError(null);
  };

  // Clears the calculated route and resets the form to its initial state,
  // without reloading the page.
  const handleReset = () => {
    clearMap();
    setFormKey((k) => k + 1); // Remount DestinationForm with default fields.
  };

  // Handle the form submission and API call
  const handleOptimizeRoute = async (formData) => {
    if (!user) return;

    setIsCalculating(true);
    setRequestError(null);

    // Build the payload for the Cloud Function
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

    try {
      // 1. Get the Firebase ID token from the current user
      const token = await user.getIdToken();

      // 2. Call the deployed Cloud Function via the service layer
      const data = await optimizeRoute(payload, token);

      // 3. Commit pins and route together, only after a successful run, so a
      //    failed request (e.g. IP rejected) never paints stale pins on the map.
      setSubmittedLocations(payload.locations);
      setRouteData(data);
    } catch (error) {
      // A failed run must never leave a stale route or pins on the map.
      setRouteData(null);
      setSubmittedLocations([]);
      setRequestError(error.message);
    } finally {
      setIsCalculating(false);
    }
  };

  if (loading) {
    return <div className="screen-msg">Loading…</div>;
  }

  if (loadError) {
    return (
      <div className="screen-msg is-error">
        Error loading Google Maps. Check your API key in the .env file.
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="app">
      {/* Full-screen map background */}
      <div className="app-map">
        {!isLoaded ? (
          <div className="map-loading">Loading map…</div>
        ) : (
          <MapComponent routeData={routeData} locations={submittedLocations} />
        )}
      </div>

      {/* User chip (top-right) */}
      <div className="user-chip glass">
        <span className="user-chip__email">{user.email}</span>
        <button className="btn-icon" onClick={handleLogout} aria-label="Log out" title="Log out">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>

      {/* Floating control panel (left) */}
      <aside className="app-panel glass">
        <header className="panel-brand">
          <img src="/favicon.svg" className="brand-mark" alt="" />
          <div>
            <h1 className="brand-title">Route Optimizer</h1>
            <p className="brand-sub">Genetic route planning</p>
          </div>
        </header>

        <DestinationForm
          key={formKey}
          onSubmit={handleOptimizeRoute}
          onValidationError={clearMap}
          isLoading={isCalculating}
        />

        {/* Request-level error (auth, IP, backend radius fallback, network) */}
        {requestError && (
          <div className="alert" role="alert">{requestError}</div>
        )}

        {/* Optimization results */}
        {routeData && routeData.route && (
          <section className="result-card">
            <h3 className="result-title">Optimized route</h3>
            <p className="result-distance">
              <span>{routeData.route.total_distance_km}</span> km total
            </p>
            <ol className="result-list">
              {routeData.route.ordered_locations.map((locId, index) => {
                const loc = submittedLocations.find((l) => l.id === locId);
                return (
                  <li key={`${locId}-${index}`}>{loc ? loc.name : locId}</li>
                );
              })}
            </ol>
          </section>
        )}

        {/* Reset: only shown once a route has been calculated */}
        {routeData && routeData.route && (
          <button type="button" className="btn-reset" onClick={handleReset}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9 9 0 0 0-6.7 3" />
              <path d="M3 3v5h5" />
            </svg>
            Clear route
          </button>
        )}
      </aside>
    </div>
  );
}