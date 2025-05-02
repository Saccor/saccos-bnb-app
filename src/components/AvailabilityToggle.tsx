'use client';

import { useState } from 'react';

interface AvailabilityToggleProps {
  propertyId: string;
  initialAvailability: boolean;
  onToggleSuccess?: (newAvailability: boolean) => void;
}

export default function AvailabilityToggle({ 
  propertyId, 
  initialAvailability,
  onToggleSuccess 
}: AvailabilityToggleProps) {
  const [availability, setAvailability] = useState(initialAvailability);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleToggle = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Du måste vara inloggad för att ändra tillgänglighet');
        setLoading(false);
        return;
      }
      
      const response = await fetch(`/api/properties/${propertyId}/toggle-availability`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Kunde inte uppdatera tillgänglighet');
      }
      
      const data = await response.json();
      
      // Update local state with new availability
      setAvailability(data.property.tillganglighet);
      
      // Call callback if provided
      if (onToggleSuccess) {
        onToggleSuccess(data.property.tillganglighet);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett fel uppstod');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`px-4 py-2 rounded-md text-white ${
          availability 
            ? 'bg-green-500 hover:bg-green-600' 
            : 'bg-red-500 hover:bg-red-600'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {loading ? 'Uppdaterar...' : availability ? 'Tillgänglig' : 'Inte tillgänglig'}
      </button>
      
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
} 