'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PropertyFormProps {
  propertyId?: string;
  initialData?: {
    namn: string;
    beskrivning: string;
    plats: string;
    prisPerNatt: number;
    tillganglighet: boolean;
  };
  isEditing?: boolean;
}

export default function PropertyForm({
  propertyId,
  initialData,
  isEditing = false
}: PropertyFormProps) {
  const [formData, setFormData] = useState({
    namn: '',
    beskrivning: '',
    plats: '',
    prisPerNatt: 0,
    tillganglighet: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === 'prisPerNatt') {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Du måste vara inloggad för att skapa eller redigera en egendom');
      }

      const url = isEditing
        ? `/api/properties/${propertyId}`
        : '/api/properties';
      
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Något gick fel');
      }

      const data = await response.json();
      setSuccess(isEditing ? 'Egendom uppdaterad!' : 'Egendom skapad!');
      
      // Redirect after a short delay
      setTimeout(() => {
        if (isEditing) {
          router.push(`/properties/${propertyId}`);
        } else {
          router.push('/properties');
        }
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett fel uppstod');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">
        {isEditing ? 'Redigera egendom' : 'Skapa ny egendom'}
      </h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="namn" className="block text-sm font-medium text-gray-700">
            Namn
          </label>
          <input
            type="text"
            id="namn"
            name="namn"
            value={formData.namn}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="plats" className="block text-sm font-medium text-gray-700">
            Plats
          </label>
          <input
            type="text"
            id="plats"
            name="plats"
            value={formData.plats}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="beskrivning" className="block text-sm font-medium text-gray-700">
            Beskrivning
          </label>
          <textarea
            id="beskrivning"
            name="beskrivning"
            value={formData.beskrivning}
            onChange={handleChange}
            required
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="prisPerNatt" className="block text-sm font-medium text-gray-700">
            Pris per natt (kr)
          </label>
          <input
            type="number"
            id="prisPerNatt"
            name="prisPerNatt"
            value={formData.prisPerNatt}
            onChange={handleChange}
            required
            min="0"
            step="1"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="tillganglighet"
            name="tillganglighet"
            checked={formData.tillganglighet}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="tillganglighet" className="ml-2 block text-sm text-gray-700">
            Tillgänglig för bokning
          </label>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading
              ? 'Sparar...'
              : isEditing
              ? 'Uppdatera egendom'
              : 'Skapa egendom'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Avbryt
          </button>
        </div>
      </form>
    </div>
  );
} 