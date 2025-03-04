'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import BookingForm from '@/components/BookingForm';
import { fetchCurrentUser, fetchPropertyById, isAuthorizedToEdit } from '@/lib/propertyUtils';

interface Property {
  _id: string;
  namn: string;
  beskrivning: string;
  plats: string;
  prisPerNatt: number;
  tillganglighet: boolean;
  agare: string;
  skapadDatum: string;
}

interface User {
  _id: string;
  namn: string;
  epost: string;
  roll: string;
}

export default function PropertyDetailsPage() {
  const params = useParams();
  const propertyId = params?.id as string;
  
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!propertyId) {
      setError('Ogiltigt egendoms-ID');
      setLoading(false);
      return;
    }
    
    const loadData = async () => {
      try {
        const token = localStorage.getItem('token');
        setIsLoggedIn(!!token);
        console.log('Authentication status on property page load:', !!token);
        
        // Fetch property data
        const propertyData = await fetchPropertyById(propertyId);
        if (!propertyData) {
          setError('Egendomen hittades inte');
          setLoading(false);
          return;
        }
        
        setProperty(propertyData);
        console.log('Property data loaded:', propertyData);
        
        // Fetch user data if logged in
        if (token) {
          const userData = await fetchCurrentUser(token);
          if (userData) {
            console.log('User data loaded:', { 
              isAdmin: userData.roll === 'admin', 
              isOwner: userData._id === propertyData.agare 
            });
            setIsAdmin(userData.roll === 'admin');
            setIsOwner(userData._id === propertyData.agare);
          } else {
            console.log('User data could not be loaded, token may be invalid');
            localStorage.removeItem('token');
            setIsLoggedIn(false);
          }
        }
      } catch (err) {
        console.error('Error loading property data:', err);
        setError(err instanceof Error ? err.message : 'Ett fel uppstod');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [propertyId]);

  const handleEdit = () => {
    router.push(`/properties/${propertyId}/edit`);
  };

  const handleDelete = async () => {
    if (!confirm('Är du säker på att du vill ta bort denna egendom?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Du måste vara inloggad för att ta bort en egendom');
      }

      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Kunde inte ta bort egendomen');
      }

      router.push('/properties');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett fel uppstod');
      console.error(err);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ErrorMessage 
            message={error}
            backUrl="/properties"
            backText="Tillbaka till egendomar"
          />
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ErrorMessage 
            message="Egendom hittades inte"
            backUrl="/properties"
            backText="Tillbaka till egendomar"
            type="warning"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/properties" className="text-blue-500 hover:text-blue-700">
          &larr; Tillbaka till egendomar
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Property Details */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-6">
              <h1 className="text-3xl font-bold">{property.namn}</h1>
              <div className="text-lg font-bold">{property.prisPerNatt} kr/natt</div>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 mb-2">
                <strong>Plats:</strong> {property.plats}
              </p>
              <p className="text-gray-600 mb-4">
                <strong>Status:</strong>{' '}
                {property.tillganglighet ? (
                  <span className="text-green-500">Tillgänglig</span>
                ) : (
                  <span className="text-red-500">Inte tillgänglig</span>
                )}
              </p>
              <div className="mt-4">
                <h2 className="text-xl font-semibold mb-2">Beskrivning</h2>
                <p className="text-gray-700 whitespace-pre-line">{property.beskrivning}</p>
              </div>
            </div>

            <div className="border-t pt-4 mt-6">
              <p className="text-sm text-gray-500">
                Skapad: {new Date(property.skapadDatum).toLocaleDateString()}
              </p>
            </div>

            {(isOwner || isAdmin) && (
              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleEdit}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Redigera
                </button>
                <button
                  onClick={handleDelete}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Ta bort
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Booking Form */}
        <div className="lg:col-span-1">
          {property.tillganglighet ? (
            <BookingForm 
              propertyId={property._id} 
              propertyName={property.namn} 
              pricePerNight={property.prisPerNatt} 
            />
          ) : (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Inte tillgänglig</h2>
              <p className="text-gray-700">
                Denna egendom är för närvarande inte tillgänglig för bokning.
              </p>
            </div>
          )}

          {/* My Bookings Link */}
          {isLoggedIn && (
            <div className="mt-4 text-center">
              <Link href="/bookings" className="text-blue-500 hover:underline">
                Visa mina bokningar
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 