import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './services/firebase';
import { useLoadScript } from '@react-google-maps/api';
import axios from 'axios';

import Login from './components/Login';
import DestinationForm from './components/DestinationForm';
import MapComponent from './components/MapComponent';

// Constant outside the component to avoid unnecessary re-renders
const libraries = ['places'];

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // New states to handle the API request and its response
  const [isCalculating, setIsCalculating] = useState(false);
  const [routeData, setRouteData] = useState(null);
  const [submittedLocations, setSubmittedLocations] = useState([]);

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
    try {
      // 1. Get the Firebase JWT token from the current user
      const token = await user.getIdToken();

      // 2. Format the payload for the FastAPI backend
      const payload = {
        locations: formData.destinations.map(d => ({
          id: d.id,
          name: d.value,
          lat: d.lat,
          lng: d.lng
        })),
        is_closed: formData.isClosedRoute 
      };

      setSubmittedLocations(payload.locations);

      // 3. Make the POST request to the local FastAPI server
      // NOTE: Ensure your FastAPI server is running on port 8000
      const response = await axios.post('http://localhost:8000/optimize', payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // 4. Save the result and log it for debugging
      console.log("Optimization Result from Backend:", response.data);
      setRouteData(response.data);
      alert("Route successfully optimized! Check the console for details.");

    } catch (error) {
      console.error("Error optimizing route:", error);
      alert(error.response?.data?.detail || "An error occurred while connecting to the backend.");
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

      <main style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        {/* Left Column: Form */}
        <div style={{ flex: '1' }}>
          <DestinationForm 
            onSubmit={handleOptimizeRoute} 
            isLoading={isCalculating} 
          />
        </div>
        
        {/* Right Column: Actual Map */}
        <div style={{ flex: '2', height: '500px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ccc' }}>
          {!isLoaded ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eaeaea' }}>
              Loading map...
            </div>
          ) : (
            <>
              {/* Pass the optimized route data to the map component */}
              <MapComponent routeData={routeData} locations={submittedLocations} />
            </>
          )}
        </div>
      </main>
    </div>
  );
}