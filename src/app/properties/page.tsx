'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';

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

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ApiResponse {
  properties: Property[];
  pagination: PaginationData;
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Get current page from URL or default to 1
  const currentPage = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
  const limit = 6; // Number of properties per page

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);

    // Fetch properties
    const fetchProperties = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/properties?page=${currentPage}&limit=${limit}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch properties');
        }
        
        const data: ApiResponse = await response.json();
        setProperties(data.properties || []);
        setPagination(data.pagination);
      } catch (err) {
        setError('Failed to load properties');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [currentPage]);

  const handleCreateProperty = () => {
    router.push('/properties/new');
  };

  const handlePageChange = (page: number) => {
    router.push(`/properties?page=${page}`);
  };

  // Generate pagination buttons
  const renderPaginationButtons = () => {
    if (!pagination) return null;
    
    const buttons = [];
    const { page, totalPages } = pagination;
    
    // Previous button
    buttons.push(
      <button
        key="prev"
        onClick={() => handlePageChange(page - 1)}
        disabled={page === 1}
        className={`px-3 py-1 mx-1 rounded ${
          page === 1 
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
            : 'bg-gray-200 hover:bg-gray-300'
        }`}
      >
        &laquo;
      </button>
    );
    
    // Page buttons
    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(totalPages, page + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 mx-1 rounded ${
            i === page 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          {i}
        </button>
      );
    }
    
    // Next button
    buttons.push(
      <button
        key="next"
        onClick={() => handlePageChange(page + 1)}
        disabled={page === totalPages}
        className={`px-3 py-1 mx-1 rounded ${
          page === totalPages 
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
            : 'bg-gray-200 hover:bg-gray-300'
        }`}
      >
        &raquo;
      </button>
    );
    
    return buttons;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Egendomar</h1>
        {isLoggedIn && (
          <button
            onClick={handleCreateProperty}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Skapa ny egendom
          </button>
        )}
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl mb-4">Inga egendomar hittades.</p>
          {isLoggedIn && (
            <button
              onClick={handleCreateProperty}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Skapa din första egendom
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <div
                key={property._id}
                className="border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="p-4">
                  <h2 className="text-xl font-semibold mb-2">{property.namn}</h2>
                  <p className="text-gray-600 mb-2">{property.plats}</p>
                  <p className="text-gray-700 mb-4 line-clamp-3">{property.beskrivning}</p>
                  <div className="flex justify-between items-center">
                    <p className="text-lg font-bold">{property.prisPerNatt} kr/natt</p>
                    <Link
                      href={`/properties/${property._id}`}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      Visa detaljer
                    </Link>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    {property.tillganglighet ? (
                      <span className="text-green-500">Tillgänglig</span>
                    ) : (
                      <span className="text-red-500">Inte tillgänglig</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center mt-8">
              {renderPaginationButtons()}
            </div>
          )}
          
          {/* Showing results info */}
          {pagination && (
            <div className="text-center mt-4 text-gray-500">
              Visar {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} av {pagination.total} egendomar
            </div>
          )}
        </>
      )}
    </div>
  );
} 