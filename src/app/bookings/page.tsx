'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';

interface Property {
  _id: string;
  namn: string;
  plats: string;
  prisPerNatt: number;
}

interface Booking {
  _id: string;
  incheckningDatum: string;
  utcheckningDatum: string;
  totalPris: number;
  egendom: Property;
  skapadDatum: string;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();

  // Function to fetch bookings
  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('No authentication token found, redirecting to login');
        router.push('/login?redirect=/bookings');
        return;
      }
      
      console.log('Fetching bookings for logged-in user');
      const response = await fetch('/api/bookings', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Bookings API response status:', response.status);
      
      if (!response.ok) {
        if (response.status === 401) {
          console.log('Authentication failed (401), removing token and redirecting');
          localStorage.removeItem('token');
          router.push('/login?redirect=/bookings');
          return;
        }
        throw new Error('Kunde inte hämta bokningar');
      }
      
      const data = await response.json();
      console.log(`Received ${data.length} bookings from API`);
      setBookings(data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err instanceof Error ? err.message : 'Ett fel uppstod');
    } finally {
      setLoading(false);
    }
  };

  // Fetch bookings on component mount
  useEffect(() => {
    fetchBookings();
  }, [router]);

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Är du säker på att du vill avboka denna bokning?')) {
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login?redirect=/bookings');
        return;
      }
      
      console.log(`Canceling booking with ID: ${bookingId}`);
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Cancel booking response status:', response.status);
      
      // Safe JSON parsing - handle potential JSON errors
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        // If we can't parse the JSON but the response was OK, still treat as success
        if (response.ok) {
          setBookings(bookings.filter(booking => booking._id !== bookingId));
          setSuccessMessage('Bokningen har avbokats');
          console.log('Booking successfully canceled');
          setLoading(false);
          return;
        } else {
          throw new Error('Kunde inte avboka bokningen - ogiltigt svar från servern');
        }
      }
      
      if (!response.ok) {
        throw new Error(data?.message || 'Kunde inte avboka bokningen');
      }
      
      // Remove the booking from the list
      setBookings(bookings.filter(booking => booking._id !== bookingId));
      setSuccessMessage('Bokningen har avbokats');
      console.log('Booking successfully canceled');
    } catch (err) {
      console.error('Error canceling booking:', err);
      setError(err instanceof Error ? err.message : 'Ett fel uppstod');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sv-SE');
  };

  const isUpcoming = (checkInDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(checkInDate) >= today;
  };

  // Calculate nights for a booking
  const calculateNights = (checkIn: string, checkOut: string) => {
    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (loading && bookings.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Mina bokningar</h1>
      
      {error && (
        <div className="mb-6">
          <ErrorMessage 
            message={error}
            backUrl="/properties"
            backText="Utforska boenden"
          />
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          {successMessage}
        </div>
      )}
      
      {loading && bookings.length > 0 && (
        <div className="mb-6 flex justify-center">
          <LoadingSpinner />
        </div>
      )}
      
      {!loading && bookings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-xl mb-4">Du har inga bokningar ännu.</p>
          <Link href="/properties" className="text-blue-500 hover:underline">
            Utforska boenden
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => (
            <div 
              key={booking._id} 
              className={`bg-white rounded-lg shadow-md p-6 ${
                !isUpcoming(booking.incheckningDatum) ? 'border-l-4 border-gray-400' : 'border-l-4 border-green-500'
              }`}
            >
              <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                <div>
                  <h2 className="text-xl font-semibold mb-2">
                    {booking.egendom ? booking.egendom.namn : 'Okänd egendom'}
                  </h2>
                  <p className="text-gray-600 mb-2">
                    {booking.egendom ? booking.egendom.plats : 'Okänd plats'}
                  </p>
                </div>
                <div className="mt-4 md:mt-0 text-right">
                  <p className="font-bold text-lg">{booking.totalPris} kr</p>
                  <p className="text-sm text-gray-500">Bokad: {formatDate(booking.skapadDatum)}</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex flex-col md:flex-row md:justify-between">
                  <div>
                    <p className="mb-1">
                      <span className="font-semibold">Incheckning:</span> {formatDate(booking.incheckningDatum)}
                    </p>
                    <p className="mb-1">
                      <span className="font-semibold">Utcheckning:</span> {formatDate(booking.utcheckningDatum)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {calculateNights(booking.incheckningDatum, booking.utcheckningDatum)} nätter 
                      {booking.egendom ? ` × ${booking.egendom.prisPerNatt} kr/natt` : ''}
                    </p>
                  </div>
                  
                  <div className="mt-4 md:mt-0 flex items-center">
                    <Link 
                      href={booking.egendom ? `/properties/${booking.egendom._id}` : '/properties'}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-2"
                    >
                      {booking.egendom ? 'Visa egendom' : 'Visa egendomar'}
                    </Link>
                    
                    {isUpcoming(booking.incheckningDatum) && (
                      <button
                        onClick={() => handleCancelBooking(booking._id)}
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                        disabled={loading}
                      >
                        {loading ? 'Avbokar...' : 'Avboka'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-8 text-center">
        <Link 
          href="/properties" 
          className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600"
        >
          Utforska fler boenden
        </Link>
      </div>
    </div>
  );
} 