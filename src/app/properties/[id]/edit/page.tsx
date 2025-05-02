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
  agare: any; // Can be string ID or object with _id
}

export default function EditPropertyPage() {
  const params = useParams();
  const propertyId = params?.id as string;
  
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
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
        
        // Store debug info
        const debugData = {
          userId: userData._id,
          userRole: userData.roll,
          propertyOwner: typeof propertyData.agare === 'string' 
            ? propertyData.agare 
            : propertyData.agare?._id || 'Unknown',
          isAuthorized: isAuthorizedToEdit(userData, propertyData)
        };
        setDebugInfo(debugData);
        console.log('Auth debug info:', debugData);
        
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
      <div className="container mx-auto py-8">
        <ErrorMessage 
          message={error}
          backUrl={`/properties/${propertyId}`}
          backText="Tillbaka till egendomen"
        />
        {debugInfo && process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 rounded">
            <h3 className="text-lg font-semibold mb-2">Debug Information:</h3>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="container mx-auto py-8">
        <ErrorMessage 
          message="Du har inte behörighet att redigera denna egendom"
          backUrl={`/properties/${propertyId}`}
          backText="Tillbaka till egendomen"
          type="warning"
        />
        {debugInfo && process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 rounded">
            <h3 className="text-lg font-semibold mb-2">Debug Information:</h3>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </div>
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