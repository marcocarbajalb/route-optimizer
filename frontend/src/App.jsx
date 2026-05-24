import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './services/firebase';
import { useLoadScript } from '@react-google-maps/api';

import Login from './components/Login';
import DestinationForm from './components/DestinationForm';
import MapComponent from './components/MapComponent';

// Constante fuera del componente para evitar re-renders innecesarios
const libraries = ['places'];

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar el script de Google Maps de forma segura
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;
  }

  if (loadError) {
    return <div style={{ textAlign: 'center', marginTop: '50px', color: 'red' }}>Error al cargar Google Maps. Revisa tu API Key en el archivo .env</div>;
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
        {/* Columna Izquierda: Formulario */}
        <div style={{ flex: '1' }}>
          <DestinationForm 
            onSubmit={(data) => console.log("Form Data:", data)} 
            isLoading={false} 
          />
        </div>
        
        {/* Columna Derecha: Mapa Real */}
        <div style={{ flex: '2', height: '500px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ccc' }}>
          {!isLoaded ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eaeaea' }}>
              Cargando mapa...
            </div>
          ) : (
            <MapComponent />
          )}
        </div>
      </main>
    </div>
  );
}
