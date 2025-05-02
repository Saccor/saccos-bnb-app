'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DateRangePicker from './DateRangePicker';
import CustomerInfoForm, { CustomerInfo } from './CustomerInfoForm';
import PriceSummary from './PriceSummary';
import { calculateNights, calculateTotalPrice, validateDates, validateCustomerInfo } from '@/lib/bookingUtils';

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
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    fornamn: '',
    efternamn: '',
    telefon: '',
    epost: ''
  });
  const router = useRouter();

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  // Calculate total price when dates change
  useEffect(() => {
    if (checkInDate && checkOutDate) {
      const calculatedNights = calculateNights(checkInDate, checkOutDate);
      setNights(calculatedNights);
      const calculatedPrice = calculateTotalPrice(pricePerNight, checkInDate, checkOutDate);
      setTotalPrice(calculatedPrice);
    } else {
      setNights(0);
      setTotalPrice(0);
    }
  }, [checkInDate, checkOutDate, pricePerNight]);

  // Handle check-in date change
  const handleCheckInChange = (date: string) => {
    setCheckInDate(date);
    setError('');
    setSuccess('');
  };

  // Handle check-out date change
  const handleCheckOutChange = (date: string) => {
    setCheckOutDate(date);
    setError('');
    setSuccess('');
  };

  // Handle customer info change
  const handleCustomerInfoChange = (info: CustomerInfo) => {
    setCustomerInfo(info);
    setError('');
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    setBookingComplete(false);

    // Validate dates
    const dateError = validateDates(checkInDate, checkOutDate);
    if (dateError) {
      setError(dateError);
      setLoading(false);
      return;
    }

    // Validate customer info
    const customerInfoError = validateCustomerInfo(customerInfo);
    if (customerInfoError) {
      setError(customerInfoError);
      setLoading(false);
      return;
    }

    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Du måste vara inloggad för att boka');
        setLoading(false);
        return;
      }

      // Create booking
      const bookingData = {
        egendom: propertyId,
        incheckningDatum: checkInDate,
        utcheckningDatum: checkOutDate,
        kund: customerInfo
      };
      
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Något gick fel vid bokning');
      }

      // Success
      setSuccess(`Bokning genomförd! Totalt pris: ${data.totalPris} kr`);
      setCheckInDate('');
      setCheckOutDate('');
      setNights(0);
      setTotalPrice(0);
      setBookingComplete(true);
      
      // Redirect to bookings page after a delay
      setTimeout(() => {
        router.push('/bookings');
      }, 3000);
    } catch (err) {
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
    }
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <DateRangePicker 
              checkInDate={checkInDate}
              checkOutDate={checkOutDate}
              onCheckInChange={handleCheckInChange}
              onCheckOutChange={handleCheckOutChange}
              disabled={loading}
            />

            <CustomerInfoForm 
              customerInfo={customerInfo}
              onChange={handleCustomerInfoChange}
              disabled={loading}
            />

            <PriceSummary 
              totalPrice={totalPrice}
              nights={nights}
            />

            <button
              type="submit"
              disabled={loading || !checkInDate || !checkOutDate}
              className={`w-full py-2 px-4 rounded-md text-white ${
                loading || !checkInDate || !checkOutDate
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {loading ? 'Bokar...' : 'Boka nu'}
            </button>
          </form>
        )
      )}
    </div>
  );
} 