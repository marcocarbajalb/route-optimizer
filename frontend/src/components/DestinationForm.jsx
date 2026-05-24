import { useState } from 'react';

export default function DestinationForm({ onSubmit, isLoading }) {
  // Initialize with 2 empty destinations to meet the minimum requirement
  const [destinations, setDestinations] = useState([
    { id: 'dest-1', value: '' },
    { id: 'dest-2', value: '' }
  ]);
  
  // Default to closed route as per most TSP problems
  const [isClosedRoute, setIsClosedRoute] = useState(true);

  const handleAddDestination = () => {
    if (destinations.length < 15) {
      setDestinations([...destinations, { id: `dest-${Date.now()}`, value: '' }]);
    }
  };

  const handleRemoveDestination = (idToRemove) => {
    if (destinations.length > 2) {
      setDestinations(destinations.filter(dest => dest.id !== idToRemove));
    }
  };

  const handleChange = (id, newValue) => {
    setDestinations(destinations.map(dest => 
      dest.id === id ? { ...dest, value: newValue } : dest
    ));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Pass the collected data to the parent component (App.jsx)
    onSubmit({ destinations, isClosedRoute });
  };

  return (
    <div style={{ backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '8px', maxWidth: '400px' }}>
      <h2 style={{ marginTop: 0 }}>Plan Your Route</h2>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        {/* Route Type Selector */}
        <div style={{ display: 'flex', gap: '15px', paddingBottom: '10px', borderBottom: '1px solid #ddd' }}>
          <label>
            <input 
              type="radio" 
              checked={isClosedRoute} 
              onChange={() => setIsClosedRoute(true)} 
            /> Closed Route (Return to start)
          </label>
          <label>
            <input 
              type="radio" 
              checked={!isClosedRoute} 
              onChange={() => setIsClosedRoute(false)} 
            /> Open Route
          </label>
        </div>

        {/* Dynamic Destination Inputs */}
        {destinations.map((dest, index) => (
          <div key={dest.id} style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder={`Destination ${index + 1}`}
              value={dest.value}
              onChange={(e) => handleChange(dest.id, e.target.value)}
              required
              style={{ flex: 1, padding: '8px' }}
            />
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

        {/* Add Destination Button (Hidden if max 15 is reached) */}
        {destinations.length < 15 && (
          <button 
            type="button" 
            onClick={handleAddDestination}
            style={{ padding: '8px', backgroundColor: '#e0e0e0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            + Add Destination
          </button>
        )}

        {/* Submit Button */}
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