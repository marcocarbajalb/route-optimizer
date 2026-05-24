import { GoogleMap } from '@react-google-maps/api';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '8px'
};

// Coordenadas iniciales (Ciudad de Guatemala)
const center = {
  lat: 14.6038,
  lng: -90.4893
};

export default function MapComponent() {
  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      zoom={12}
      center={center}
      options={{
        disableDefaultUI: true, // Limpia la interfaz del mapa (quita botones innecesarios)
        zoomControl: true,      // Deja solo el control de zoom
      }}
    >
      {/* Más adelante inyectaremos aquí los <Marker /> y el trazado de la ruta */}
    </GoogleMap>
  );
}