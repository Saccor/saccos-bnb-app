'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import { UserRole } from '@/models/User';

interface User {
  _id: string;
  namn: string;
  epost: string;
  roll: string;
  isAdmin?: boolean;
  skapadDatum?: string;
}

interface PropertyOwner {
  _id: string;
  namn: string;
  epost: string;
}

interface Property {
  _id: string;
  namn: string;
  beskrivning: string;
  plats: string;
  prisPerNatt: number;
  tillganglighet: boolean;
  status: string;
  agare: PropertyOwner | string;
  skapadAv?: User;  // Keep for backward compatibility
  skapadDatum: string;
}

interface Booking {
  _id: string;
  incheckningDatum: string;
  utcheckningDatum: string;
  totalPris: number;
  egendom: Property;
  user: User;
  skapadDatum: string;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'properties' | 'bookings' | 'users'>('properties');
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalBookings: 0,
    totalUsers: 0,
    totalRevenue: 0
  });
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          router.push('/login?redirect=/admin');
          return;
        }
        
        const response = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Kunde inte hämta användarinformation');
        }
        
        const userData = await response.json();
        
        if (userData.roll !== UserRole.ADMIN) {
          setError('Du har inte behörighet att visa denna sida');
          setLoading(false);
          return;
        }
        
        setIsAdmin(true);
        fetchData(token);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ett fel uppstod');
        setLoading(false);
      }
    };
    
    checkAdminStatus();
  }, [router]);

  const fetchData = async (token: string) => {
    try {
      setLoading(true);
      
      // Fetch properties
      const propertiesResponse = await fetch('/api/properties', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!propertiesResponse.ok) {
        throw new Error('Kunde inte hämta egendomar');
      }
      
      const propertiesData = await propertiesResponse.json();
      
      // Debug property owner information
      if (propertiesData.properties && propertiesData.properties.length > 0) {
        console.log('First property owner data:', {
          property: propertiesData.properties[0].namn,
          agare: propertiesData.properties[0].agare,
          skapadAv: propertiesData.properties[0].skapadAv
        });
      }
      
      setProperties(propertiesData.properties || []);
      
      // Fetch bookings
      const bookingsResponse = await fetch('/api/bookings', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!bookingsResponse.ok) {
        throw new Error('Kunde inte hämta bokningar');
      }
      
      const bookingsData = await bookingsResponse.json();
      setBookings(bookingsData || []);
      
      // Fetch users (we'll need to create this endpoint)
      const usersResponse = await fetch('/api/users', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        // Check if the response has the users array property (new format)
        setUsers(usersData.users || usersData || []);
      } else {
        console.log('Could not fetch users:', usersResponse.status);
        // Don't set error, just log it - we'll show a message in the UI
      }
      
      // Calculate stats
      const totalRevenue = bookingsData.reduce((sum: number, booking: Booking) => sum + booking.totalPris, 0);
      
      setStats({
        totalProperties: propertiesData.properties?.length || 0,
        totalBookings: bookingsData.length || 0,
        totalUsers: users.length || 0,
        totalRevenue
      });
      
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett fel uppstod');
      setLoading(false);
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna egendom?')) {
      return;
    }
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login?redirect=/admin');
        return;
      }
      
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Safe JSON parsing - handle potential JSON errors
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        // If we can't parse the JSON but the response was OK, still treat as success
        if (response.ok) {
          // Remove the property from the list
          setProperties(properties.filter(property => property._id !== propertyId));
          
          // Refresh bookings as they might be affected
          const bookingsResponse = await fetch('/api/bookings', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          if (bookingsResponse.ok) {
            try {
              const bookingsData = await bookingsResponse.json();
              setBookings(bookingsData || []);
            } catch (bookingJsonError) {
              console.error('Error parsing bookings response:', bookingJsonError);
            }
          }
          
          // Update stats
          setStats(prev => ({
            ...prev,
            totalProperties: prev.totalProperties - 1
          }));
          
          setSuccessMessage('Egendomen har tagits bort');
          setTimeout(() => setSuccessMessage(''), 3000);
          setLoading(false);
          return;
        } else {
          throw new Error('Kunde inte ta bort egendomen - ogiltigt svar från servern');
        }
      }
      
      if (!response.ok) {
        throw new Error(data?.message || 'Kunde inte ta bort egendomen');
      }
      
      // Remove the property from the list
      setProperties(properties.filter(property => property._id !== propertyId));
      
      // Refresh bookings as they might be affected
      const bookingsResponse = await fetch('/api/bookings', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (bookingsResponse.ok) {
        try {
          const bookingsData = await bookingsResponse.json();
          setBookings(bookingsData || []);
        } catch (bookingJsonError) {
          console.error('Error parsing bookings response:', bookingJsonError);
        }
      }
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalProperties: prev.totalProperties - 1
      }));
      
      setSuccessMessage('Egendomen har tagits bort');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett fel uppstod');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Är du säker på att du vill avboka denna bokning?')) {
      return;
    }
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login?redirect=/admin');
        return;
      }
      
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Safe JSON parsing - handle potential JSON errors
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        // If we can't parse the JSON but the response was OK, still treat as success
        if (response.ok) {
          // Remove the booking from the list
          const canceledBooking = bookings.find(booking => booking._id === bookingId);
          setBookings(bookings.filter(booking => booking._id !== bookingId));
          
          // Update stats
          if (canceledBooking) {
            setStats(prev => ({
              ...prev,
              totalBookings: prev.totalBookings - 1,
              totalRevenue: prev.totalRevenue - canceledBooking.totalPris
            }));
          }
          
          setSuccessMessage('Bokningen har avbokats');
          setTimeout(() => setSuccessMessage(''), 3000);
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
      const canceledBooking = bookings.find(booking => booking._id === bookingId);
      setBookings(bookings.filter(booking => booking._id !== bookingId));
      
      // Update stats
      if (canceledBooking) {
        setStats(prev => ({
          ...prev,
          totalBookings: prev.totalBookings - 1,
          totalRevenue: prev.totalRevenue - canceledBooking.totalPris
        }));
      }
      
      setSuccessMessage('Bokningen har avbokats');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett fel uppstod');
    } finally {
      setLoading(false);
    }
  };

  const handleMakeAdmin = async (userId: string) => {
    if (!confirm('Är du säker på att du vill göra denna användare till administratör?')) {
      return;
    }
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login?redirect=/admin');
        return;
      }
      
      const response = await fetch('/api/auth/update-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          userId, 
          role: 'ADMIN' 
        })
      });
      
      // Safe JSON parsing - handle potential JSON errors
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        // If we can't parse the JSON but the response was OK, still treat as success
        if (response.ok) {
          // Update the user in the list
          setUsers(users.map(user => 
            user._id === userId 
              ? { ...user, roll: 'ADMIN' } 
              : user
          ));
          
          setSuccessMessage('Användaren har fått administratörsbehörighet');
          setTimeout(() => setSuccessMessage(''), 3000);
          setLoading(false);
          return;
        } else {
          throw new Error('Kunde inte uppdatera användarens roll - ogiltigt svar från servern');
        }
      }
      
      if (!response.ok) {
        throw new Error(data?.message || 'Kunde inte uppdatera användaren');
      }
      
      // Update the user in the list
      setUsers(users.map(user => 
        user._id === userId 
          ? { ...user, roll: 'ADMIN' } 
          : user
      ));
      
      setSuccessMessage('Användaren har fått administratörsbehörighet');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett fel uppstod');
    } finally {
      setLoading(false);
    }
  };

  const handleMakeListingAgent = async (userId: string) => {
    if (!confirm('Är du säker på att du vill göra denna användare till listningsagent?')) {
      return;
    }
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login?redirect=/admin');
        return;
      }
      
      const response = await fetch('/api/auth/update-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          userId, 
          role: 'LISTING_AGENT' 
        })
      });
      
      // Safe JSON parsing - handle potential JSON errors
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        // If we can't parse the JSON but the response was OK, still treat as success
        if (response.ok) {
          // Update the user in the list
          setUsers(users.map(user => 
            user._id === userId 
              ? { ...user, roll: 'LISTING_AGENT' } 
              : user
          ));
          
          setSuccessMessage('Användaren har fått listningsagentbehörighet');
          setTimeout(() => setSuccessMessage(''), 3000);
          setLoading(false);
          return;
        } else {
          throw new Error('Kunde inte uppdatera användarens roll - ogiltigt svar från servern');
        }
      }
      
      if (!response.ok) {
        throw new Error(data?.message || 'Kunde inte uppdatera användaren');
      }
      
      // Update the user in the list
      setUsers(users.map(user => 
        user._id === userId 
          ? { ...user, roll: 'LISTING_AGENT' } 
          : user
      ));
      
      setSuccessMessage('Användaren har fått listningsagentbehörighet');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
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

  const handleStatusChange = async (propertyId: string, newStatus: string) => {
    try {
      setStatusUpdateLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login?redirect=/admin');
        return;
      }
      
      const response = await fetch(`/api/properties/${propertyId}/update-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          status: newStatus,
          anledning: newStatus === 'rejected' ? 'Avvisad av admin' : undefined
        })
      });
      
      // Safe JSON parsing - handle potential JSON errors
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        // If we can't parse the JSON but the response was OK, still treat as success
        if (response.ok) {
          // Update the property in the list
          setProperties(properties.map(property => 
            property._id === propertyId 
              ? { ...property, status: newStatus } 
              : property
          ));
          
          setSuccessMessage(`Egendomens status har ändrats till ${newStatus}`);
          setTimeout(() => setSuccessMessage(''), 3000);
          setStatusUpdateLoading(false);
          return;
        } else {
          throw new Error('Kunde inte uppdatera egendomens status - ogiltigt svar från servern');
        }
      }
      
      if (!response.ok) {
        throw new Error(data?.message || 'Kunde inte uppdatera egendomens status');
      }
      
      // Update the property in the list
      setProperties(properties.map(property => 
        property._id === propertyId 
          ? { ...property, status: newStatus } 
          : property
      ));
      
      setSuccessMessage(`Egendomens status har ändrats till ${newStatus}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett fel uppstod');
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const handleBatchStatusChange = async (newStatus: string) => {
    if (selectedProperties.length === 0) {
      setError('Inga egendomar valda');
      return;
    }

    try {
      setStatusUpdateLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login?redirect=/admin');
        return;
      }
      
      const response = await fetch('/api/properties/batch-update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          propertyIds: selectedProperties,
          status: newStatus,
          anledning: newStatus === 'rejected' ? 'Avvisad av admin' : undefined
        })
      });
      
      // Safe JSON parsing - handle potential JSON errors
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        // If we can't parse the JSON but the response was OK, still treat as success
        if (response.ok) {
          // Update the properties in the list
          setProperties(properties.map(property => 
            selectedProperties.includes(property._id) 
              ? { ...property, status: newStatus } 
              : property
          ));
          
          setSuccessMessage(`${selectedProperties.length} egendomar har fått status ${newStatus}`);
          setSelectedProperties([]);
          setTimeout(() => setSuccessMessage(''), 3000);
          setStatusUpdateLoading(false);
          return;
        } else {
          throw new Error('Kunde inte uppdatera egendomarnas status - ogiltigt svar från servern');
        }
      }
      
      if (!response.ok) {
        throw new Error(data?.message || 'Kunde inte uppdatera egendomarnas status');
      }

      const modifiedCount = data?.modifiedCount || selectedProperties.length;
      
      // Update the properties in the list
      setProperties(properties.map(property => 
        selectedProperties.includes(property._id) 
          ? { ...property, status: newStatus } 
          : property
      ));
      
      setSuccessMessage(`${modifiedCount} egendomar har fått status ${newStatus}`);
      setSelectedProperties([]);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett fel uppstod');
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const handleSelectProperty = (propertyId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedProperties([...selectedProperties, propertyId]);
    } else {
      setSelectedProperties(selectedProperties.filter(id => id !== propertyId));
    }
  };

  const handleSelectAllProperties = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedProperties(properties.map(property => property._id));
    } else {
      setSelectedProperties([]);
    }
  };

  // Utility function to safely get owner name from property owner
  const getOwnerName = (owner: PropertyOwner | string | undefined): string => {
    if (!owner) return 'Okänd';
    if (typeof owner === 'object' && 'namn' in owner) {
      return owner.namn;
    }
    return 'Okänd';
  };

  if (loading && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ErrorMessage 
            message={error}
            backUrl="/"
            backText="Tillbaka till startsidan"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-500">Totalt antal egendomar</h2>
          <p className="text-3xl font-bold">{stats.totalProperties}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-500">Totalt antal bokningar</h2>
          <p className="text-3xl font-bold">{stats.totalBookings}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-500">Totalt antal användare</h2>
          <p className="text-3xl font-bold">{stats.totalUsers}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-500">Total intäkt</h2>
          <p className="text-3xl font-bold">{stats.totalRevenue} kr</p>
        </div>
      </div>
      
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          {successMessage}
        </div>
      )}
      
      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === 'properties'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('properties')}
        >
          Egendomar
        </button>
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === 'bookings'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('bookings')}
        >
          Bokningar
        </button>
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === 'users'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('users')}
        >
          Användare
        </button>
      </div>
      
      {error && (
        <div className="mb-6">
          <ErrorMessage 
            message={error}
            type="warning"
          />
        </div>
      )}
      
      {loading && (
        <div className="flex justify-center my-8">
          <LoadingSpinner />
        </div>
      )}
      
      {/* Properties Tab */}
      {activeTab === 'properties' && !loading && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Alla egendomar</h2>
            <div className="flex space-x-2">
              {selectedProperties.length > 0 && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleBatchStatusChange('active')}
                    disabled={statusUpdateLoading}
                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm"
                  >
                    Aktivera valda
                  </button>
                  <button
                    onClick={() => handleBatchStatusChange('inactive')}
                    disabled={statusUpdateLoading}
                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 text-sm"
                  >
                    Inaktivera valda
                  </button>
                  <button
                    onClick={() => handleBatchStatusChange('rejected')}
                    disabled={statusUpdateLoading}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                  >
                    Avvisa valda
                  </button>
                </div>
              )}
              <Link 
                href="/properties/new" 
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Lägg till ny egendom
              </Link>
            </div>
          </div>
          
          {properties.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg shadow-md">
              <p className="text-gray-500">Inga egendomar hittades</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-md">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-3 px-2">
                      <input 
                        type="checkbox" 
                        onChange={(e) => handleSelectAllProperties(e.target.checked)}
                        checked={selectedProperties.length === properties.length}
                      />
                    </th>
                    <th className="py-3 px-4 text-left">Namn</th>
                    <th className="py-3 px-4 text-left">Plats</th>
                    <th className="py-3 px-4 text-left">Pris/natt</th>
                    <th className="py-3 px-4 text-left">Status</th>
                    <th className="py-3 px-4 text-left">Tillgänglighet</th>
                    <th className="py-3 px-4 text-left">Skapad av</th>
                    <th className="py-3 px-4 text-left">Skapad datum</th>
                    <th className="py-3 px-4 text-left">Åtgärder</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map((property) => (
                    <tr key={property._id} className="border-t hover:bg-gray-50">
                      <td className="py-3 px-2 text-center">
                        <input 
                          type="checkbox" 
                          onChange={(e) => handleSelectProperty(property._id, e.target.checked)}
                          checked={selectedProperties.includes(property._id)}
                        />
                      </td>
                      <td className="py-3 px-4">{property.namn}</td>
                      <td className="py-3 px-4">{property.plats}</td>
                      <td className="py-3 px-4">{property.prisPerNatt} kr</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          property.status === 'active' ? 'bg-green-100 text-green-800' :
                          property.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' :
                          property.status === 'pending_review' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {property.status === 'active' ? 'Aktiv' :
                           property.status === 'inactive' ? 'Inaktiv' :
                           property.status === 'pending_review' ? 'Väntar granskning' :
                           'Avvisad'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {property.tillganglighet ? (
                          <span className="text-green-500">Tillgänglig</span>
                        ) : (
                          <span className="text-red-500">Inte tillgänglig</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {(() => {
                          if (property.agare && typeof property.agare === 'object' && 'namn' in property.agare) {
                            return property.agare.namn;
                          }
                          
                          if (property.skapadAv && property.skapadAv.namn) {
                            return property.skapadAv.namn;
                          }
                          
                          return 'Okänd';
                        })()}
                      </td>
                      <td className="py-3 px-4">{formatDate(property.skapadDatum)}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col space-y-1">
                          <div className="flex space-x-2">
                            <Link 
                              href={`/properties/${property._id}`}
                              className="text-blue-500 hover:underline text-sm"
                            >
                              Visa
                            </Link>
                            <Link 
                              href={`/properties/${property._id}/edit`}
                              className="text-green-500 hover:underline text-sm"
                            >
                              Redigera
                            </Link>
                            <button
                              onClick={() => handleDeleteProperty(property._id)}
                              className="text-red-500 hover:underline text-sm"
                            >
                              Ta bort
                            </button>
                          </div>
                          <div className="flex space-x-2 mt-1">
                            <button
                              onClick={() => handleStatusChange(property._id, 'active')}
                              className="text-green-600 hover:underline text-xs"
                              disabled={property.status === 'active' || statusUpdateLoading}
                            >
                              Aktivera
                            </button>
                            <button
                              onClick={() => handleStatusChange(property._id, 'inactive')}
                              className="text-yellow-600 hover:underline text-xs"
                              disabled={property.status === 'inactive' || statusUpdateLoading}
                            >
                              Inaktivera
                            </button>
                            <button
                              onClick={() => handleStatusChange(property._id, 'rejected')}
                              className="text-red-600 hover:underline text-xs"
                              disabled={property.status === 'rejected' || statusUpdateLoading}
                            >
                              Avvisa
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      
      {/* Bookings Tab */}
      {activeTab === 'bookings' && !loading && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Alla bokningar</h2>
          
          {bookings.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg shadow-md">
              <p className="text-gray-500">Inga bokningar hittades</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-md">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-3 px-4 text-left">Egendom</th>
                    <th className="py-3 px-4 text-left">Ägare</th>
                    <th className="py-3 px-4 text-left">Användare</th>
                    <th className="py-3 px-4 text-left">Incheckning</th>
                    <th className="py-3 px-4 text-left">Utcheckning</th>
                    <th className="py-3 px-4 text-left">Totalt pris</th>
                    <th className="py-3 px-4 text-left">Status</th>
                    <th className="py-3 px-4 text-left">Åtgärder</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking._id} className="border-t hover:bg-gray-50">
                      <td className="py-3 px-4">{booking.egendom?.namn || 'Okänd'}</td>
                      <td className="py-3 px-4">{getOwnerName(booking.egendom?.agare)}</td>
                      <td className="py-3 px-4">{booking.user?.namn || 'Okänd'}</td>
                      <td className="py-3 px-4">{formatDate(booking.incheckningDatum)}</td>
                      <td className="py-3 px-4">{formatDate(booking.utcheckningDatum)}</td>
                      <td className="py-3 px-4">{booking.totalPris} kr</td>
                      <td className="py-3 px-4">
                        {isUpcoming(booking.incheckningDatum) ? (
                          <span className="text-green-500">Kommande</span>
                        ) : (
                          <span className="text-gray-500">Tidigare</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <Link 
                            href={`/properties/${booking.egendom?._id}`}
                            className="text-blue-500 hover:underline"
                          >
                            Visa egendom
                          </Link>
                          {isUpcoming(booking.incheckningDatum) && (
                            <button
                              onClick={() => handleCancelBooking(booking._id)}
                              className="text-red-500 hover:underline"
                            >
                              Avboka
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      
      {/* Users Tab */}
      {activeTab === 'users' && !loading && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Alla användare</h2>
          
          {users.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg shadow-md">
              <p className="text-gray-500">Inga användare hittades</p>
              <p className="text-sm text-gray-400 mt-2">Skapa en API-endpoint för att hämta användare</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-md">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-3 px-4 text-left">Namn</th>
                    <th className="py-3 px-4 text-left">E-post</th>
                    <th className="py-3 px-4 text-left">Roll</th>
                    <th className="py-3 px-4 text-left">Skapad datum</th>
                    <th className="py-3 px-4 text-left">Åtgärder</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} className="border-t hover:bg-gray-50">
                      <td className="py-3 px-4">{user.namn}</td>
                      <td className="py-3 px-4">{user.epost}</td>
                      <td className="py-3 px-4">
                        {user.roll === 'admin' ? (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Admin</span>
                        ) : (
                          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">Användare</span>
                        )}
                      </td>
                      <td className="py-3 px-4">{user.skapadDatum ? formatDate(user.skapadDatum) : 'Okänd'}</td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          {user.roll !== 'ADMIN' && (
                            <button
                              onClick={() => handleMakeAdmin(user._id)}
                              className="text-blue-500 hover:underline"
                            >
                              Gör till admin
                            </button>
                          )}
                          {user.roll !== 'LISTING_AGENT' && user.roll !== 'ADMIN' && (
                            <button
                              onClick={() => handleMakeListingAgent(user._id)}
                              className="text-green-500 hover:underline"
                            >
                              Gör till agent
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 