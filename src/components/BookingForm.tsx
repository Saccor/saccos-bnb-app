'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface BookingFormProps {
  propertyId: string;
  propertyName: string;
  pricePerNight: number;
}

export default function BookingForm({ propertyId, propertyName, pricePerNight }: BookingFormProps) {
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [totalPrice, setTotalPrice] = useState(0);
  const [nights, setNights] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const router = useRouter();

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
    console.log('Authentication status on load:', !!token);
  }, []);

  // Calculate total price when dates change
  const calculatePrice = () => {
    if (checkInDate && checkOutDate) {
      const startDate = new Date(checkInDate);
      const endDate = new Date(checkOutDate);
      
      // Calculate nights
      const timeDiff = endDate.getTime() - startDate.getTime();
      const nightCount = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      
      if (nightCount > 0) {
        setNights(nightCount);
        // Calculate total price based on price per night and length of stay
        const calculatedTotalPrice = nightCount * pricePerNight;
        setTotalPrice(calculatedTotalPrice);
        console.log(`Total price calculated: ${calculatedTotalPrice} kr (${nightCount} nights at ${pricePerNight} kr/night)`);
      } else {
        setNights(0);
        setTotalPrice(0);
      }
    }
  };

  // Handle check-in date change
  const handleCheckInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCheckInDate(e.target.value);
    setError('');
    setSuccess('');
    if (checkOutDate) {
      setTimeout(calculatePrice, 0);
    }
  };

  // Handle check-out date change
  const handleCheckOutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCheckOutDate(e.target.value);
    setError('');
    setSuccess('');
    if (checkInDate) {
      setTimeout(calculatePrice, 0);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted - starting booking process');
    setLoading(true);
    setError('');
    setSuccess('');
    setBookingComplete(false);

    // Validate dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startDate = new Date(checkInDate);
    const endDate = new Date(checkOutDate);
    
    console.log('Validating dates:', { checkInDate, checkOutDate, today: today.toISOString() });
    
    if (startDate < today) {
      setError('Incheckningsdatum kan inte vara i det förflutna');
      setLoading(false);
      console.log('Error: Check-in date is in the past');
      return;
    }
    
    if (startDate >= endDate) {
      setError('Utcheckningsdatum måste vara efter incheckningsdatum');
      setLoading(false);
      console.log('Error: Check-out date must be after check-in date');
      return;
    }

    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      console.log('Authentication token retrieved:', token ? 'Token exists' : 'No token found');
      
      if (!token) {
        setError('Du måste vara inloggad för att boka');
        setLoading(false);
        console.log('Error: User not logged in');
        return;
      }

      // Create booking
      const bookingData = {
        egendom: propertyId,
        incheckningDatum: checkInDate,
        utcheckningDatum: checkOutDate
      };
      
      console.log('Sending booking request with data:', bookingData);
      
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      });

      console.log('Booking response status:', response.status);
      const data = await response.json();
      console.log('Booking response data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Något gick fel vid bokning');
      }

      // Success
      console.log('Booking successful:', data);
      setSuccess(`Bokning genomförd! Totalt pris: ${data.totalPris} kr`);
      setCheckInDate('');
      setCheckOutDate('');
      setNights(0);
      setTotalPrice(0);
      setBookingComplete(true);
      
      // Redirect to bookings page after a delay
      console.log('Will redirect to bookings page in 3 seconds');
      setTimeout(() => {
        router.push('/bookings');
      }, 3000);
    } catch (err) {
      console.error('Error during booking:', err);
      setError(err instanceof Error ? err.message : 'Något gick fel vid bokning');
      
      // Check if token might be invalid and prompt re-login
      if (err instanceof Error && (
        err.message.includes('token') || 
        err.message.includes('autentisering') || 
        err.message.includes('Ogiltig')
      )) {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setError('Din session har gått ut. Vänligen logga in igen.');
      }
    } finally {
      setLoading(false);
      console.log('Booking process completed, loading state reset');
    }
  };

  // Get minimum date (today) for date inputs
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get minimum check-out date (day after check-in)
  const getMinCheckOutDate = () => {
    if (!checkInDate) return getMinDate();
    
    const dayAfterCheckIn = new Date(checkInDate);
    dayAfterCheckIn.setDate(dayAfterCheckIn.getDate() + 1);
    return dayAfterCheckIn.toISOString().split('T')[0];
  };

  // Handle login redirect
  const handleLoginRedirect = () => {
    router.push(`/login?redirect=/properties/${propertyId}`);
  };

  // Handle view bookings
  const handleViewBookings = () => {
    router.push('/bookings');
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Boka {propertyName}</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          {!isAuthenticated && (
            <div className="mt-2">
              <button 
                onClick={handleLoginRedirect}
                className="text-blue-600 underline"
              >
                Logga in här
              </button>
            </div>
          )}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
          {bookingComplete && (
            <div className="mt-2 flex flex-col items-center">
              <p className="text-sm mb-2">Du kommer att omdirigeras till dina bokningar...</p>
              <Link 
                href="/bookings" 
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Visa mina bokningar
              </Link>
            </div>
          )}
        </div>
      )}
      
      {!isAuthenticated ? (
        <div className="text-center py-4">
          <p className="mb-4">Du måste vara inloggad för att boka denna egendom.</p>
          <button
            onClick={handleLoginRedirect}
            className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
          >
            Logga in för att boka
          </button>
        </div>
      ) : (
        bookingComplete ? (
          <div className="text-center py-4">
            <p className="mb-4">Tack för din bokning!</p>
            <button
              onClick={handleViewBookings}
              className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
            >
              Visa alla mina bokningar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="checkInDate" className="block text-gray-700 mb-2">
                Incheckningsdatum
              </label>
              <input
                type="date"
                id="checkInDate"
                value={checkInDate}
                onChange={handleCheckInChange}
                min={getMinDate()}
                className="w-full px-3 py-2 border rounded-md"
                required
                disabled={loading}
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="checkOutDate" className="block text-gray-700 mb-2">
                Utcheckningsdatum
              </label>
              <input
                type="date"
                id="checkOutDate"
                value={checkOutDate}
                onChange={handleCheckOutChange}
                min={getMinCheckOutDate()}
                className="w-full px-3 py-2 border rounded-md"
                required
                disabled={loading || !checkInDate}
              />
            </div>
            
            {nights > 0 && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h3 className="font-semibold text-center mb-2">Prisberäkning</h3>
                <div className="flex justify-between mb-2">
                  <span>Pris per natt:</span>
                  <span>{pricePerNight} kr</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Antal nätter:</span>
                  <span>{nights}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t border-blue-200 pt-2 mt-2">
                  <span>Totalt pris:</span>
                  <span>{totalPrice} kr</span>
                </div>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Totalpriset beräknas baserat på pris per natt och vistelselängd
                </p>
              </div>
            )}
            
            <button
              type="submit"
              className={`w-full py-2 px-4 rounded-md ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : nights > 0
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'bg-gray-300 cursor-not-allowed text-gray-500'
              }`}
              disabled={loading || !checkInDate || !checkOutDate || nights <= 0}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Bearbetar...
                </span>
              ) : (
                'Boka nu'
              )}
            </button>
          </form>
        )
      )}
    </div>
  );
} 