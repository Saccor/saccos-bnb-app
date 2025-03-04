'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PropertyForm from '@/components/PropertyForm';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import { fetchCurrentUser, fetchPropertyById, isAuthorizedToEdit } from '@/lib/propertyUtils';

interface Property {
  _id: string;
  namn: string;
  beskrivning: string;
  plats: string;
  prisPerNatt: number;
  tillganglighet: boolean;
  agare: string;
}

export default function EditPropertyPage() {
  const params = useParams();
  const propertyId = params?.id as string;
  
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!propertyId) {
      setError('Ogiltigt egendoms-ID');
      setLoading(false);
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      router.push(`/login?redirect=/properties/${propertyId}/edit`);
      return;
    }

    const loadData = async () => {
      try {
        // Fetch property data
        const propertyData = await fetchPropertyById(propertyId, token);
        setProperty(propertyData);

        // Fetch user data and check authorization
        const userData = await fetchCurrentUser(token);
        if (!userData) {
          throw new Error('Kunde inte verifiera användaren');
        }
        
        // Check if user is authorized to edit
        if (isAuthorizedToEdit(userData, propertyData)) {
          setIsAuthorized(true);
        } else {
          setError('Du har inte behörighet att redigera denna egendom');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ett fel uppstod');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [propertyId, router]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <ErrorMessage 
        message={error}
        onBackClick={() => router.push(`/properties/${propertyId}`)}
        backText="Tillbaka till egendomen"
      />
    );
  }

  if (!isAuthorized) {
    return (
      <ErrorMessage 
        message="Du har inte behörighet att redigera denna egendom"
        onBackClick={() => router.push(`/properties/${propertyId}`)}
        backText="Tillbaka till egendomen"
        type="warning"
      />
    );
  }

  if (!property) {
    return null;
  }

  const initialData = {
    namn: property.namn,
    beskrivning: property.beskrivning,
    plats: property.plats,
    prisPerNatt: property.prisPerNatt,
    tillganglighet: property.tillganglighet
  };

  return (
    <div className="container mx-auto py-8">
      <PropertyForm 
        propertyId={propertyId}
        initialData={initialData}
        isEditing={true}
      />
    </div>
  );
} 