'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FileUpload from './FileUpload';

interface PropertyFormProps {
  propertyId?: string;
  initialData?: {
    namn: string;
    beskrivning: string;
    plats: string;
    prisPerNatt: number;
    tillganglighet: boolean;
    bilder?: string[];
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
    tillganglighet: true,
    bilder: [] as string[]
  });
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        bilder: initialData.bilder || []
      });
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

  const handleFileSelect = (files: File[]) => {
    setUploadFiles(files);
  };

  const handleRemoveExistingImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      bilder: prev.bilder.filter((_, i) => i !== index)
    }));
  };

  // Upload images first, then create/update property
  const uploadImages = async (): Promise<string[]> => {
    if (uploadFiles.length === 0) {
      return [];
    }

    setUploadLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Du måste vara inloggad för att ladda upp bilder');
      }
      
      const formData = new FormData();
      uploadFiles.forEach(file => {
        formData.append('files', file);
      });
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Kunde inte ladda upp bilder');
      }
      
      const data = await response.json();
      return data.urls;
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    } finally {
      setUploadLoading(false);
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

      // First upload images if there are any
      let imageUrls: string[] = [];
      if (uploadFiles.length > 0) {
        imageUrls = await uploadImages();
      }

      // Combine existing images with new uploaded images
      const allImages = [...formData.bilder, ...imageUrls];

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
        body: JSON.stringify({
          ...formData,
          bilder: allImages
        })
      });

      // Safe JSON parsing with error handling
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        // If we can't parse the JSON but the response was OK, still consider it a success
        if (response.ok) {
          setSuccess(isEditing ? 'Egendom uppdaterad!' : 'Egendom skapad!');
          
          // Redirect after a short delay
          setTimeout(() => {
            if (isEditing) {
              router.push(`/properties/${propertyId}`);
            } else {
              router.push('/properties');
            }
          }, 1500);
          return;
        } else {
          throw new Error('Ett fel uppstod när förfrågan behandlades');
        }
      }

      if (!response.ok) {
        throw new Error(data?.message || 'Något gick fel');
      }

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
      // Enhanced error handling with debug info if available
      if (err instanceof Error) {
        setError(err.message);
        console.error('Error submitting form:', err);
        
        // Log any debug info that might be in the error
        if (typeof err === 'object' && err !== null && 'debug' in err) {
          console.error('Debug info:', (err as any).debug);
        }
      } else {
        setError('Ett fel uppstod');
        console.error('Unknown error submitting form:', err);
      }
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

        {/* File Upload Component */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bilder
          </label>
          <FileUpload 
            onFileSelect={handleFileSelect}
            existingImages={formData.bilder}
            onRemoveExisting={handleRemoveExistingImage}
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading || uploadLoading}
            className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading || uploadLoading
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