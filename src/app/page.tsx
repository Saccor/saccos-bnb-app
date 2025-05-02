'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import LoadingSpinner from "@/components/LoadingSpinner";

interface Property {
  _id: string;
  namn: string;
  plats: string;
  prisPerNatt: number;
  beskrivning: string;
  tillganglighet: boolean;
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

export default function Home() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchProperties() {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        // Fetch properties with a limit of 3 for featured section
        const response = await fetch('/api/properties?limit=3', {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch properties');
        }
        
        const data: ApiResponse = await response.json();
        setProperties(data.properties || []);
      } catch (err) {
        console.error('Error fetching properties:', err);
        setError('Could not load properties. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchProperties();
  }, []);

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-16 bg-gray-50 rounded-lg">
        <h1 className="text-4xl font-bold mb-4">Välkommen till Saccos BnB</h1>
        <p className="text-xl text-gray-600 mb-8">Hitta ditt perfekta boende för din nästa resa</p>
        <Link 
          href="/properties" 
          className="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 inline-block"
        >
          Utforska boenden
        </Link>
      </section>

      {/* Featured Properties Section */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Utvalda boenden</h2>
        
        {loading ? (
          <div className="py-8">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : properties.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Inga boenden tillgängliga för tillfället.</p>
            <p className="mt-2">
              <Link href="/properties/new" className="text-blue-500 hover:underline">
                Lägg till ett nytt boende
              </Link>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <Link 
                href={`/properties/${property._id}`} 
                key={property._id}
                className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow block"
              >
                <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                  {/* Image placeholder - could be replaced with actual property images in the future */}
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">Bild saknas</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{property.namn}</h3>
                  <p className="text-gray-600 mb-2">{property.plats}</p>
                  <p className="font-bold">{property.prisPerNatt} kr/natt</p>
                  {!property.tillganglighet && (
                    <p className="text-red-500 text-sm mt-2">Inte tillgänglig</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
        
        <div className="mt-6 text-center">
          <Link 
            href="/properties" 
            className="text-blue-500 hover:underline"
          >
            Visa alla boenden &rarr;
          </Link>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-12">
        <h2 className="text-2xl font-bold mb-8 text-center">Hur det fungerar</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-500 font-bold">1</span>
            </div>
            <h3 className="font-semibold mb-2">Sök</h3>
            <p className="text-gray-600">Hitta det perfekta boendet för dina behov</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-500 font-bold">2</span>
            </div>
            <h3 className="font-semibold mb-2">Boka</h3>
            <p className="text-gray-600">Välj datum och genomför bokningen</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-500 font-bold">3</span>
            </div>
            <h3 className="font-semibold mb-2">Njut</h3>
            <p className="text-gray-600">Checka in och njut av din vistelse</p>
          </div>
        </div>
      </section>
    </div>
  );
}
