'use client';

import Link from 'next/link';

interface PropertyCardProps {
  property: {
    _id: string;
    namn: string;
    beskrivning: string;
    plats: string;
    prisPerNatt: number;
    tillganglighet: boolean;
    bilder?: string[];
  };
  showDescription?: boolean;
}

export default function PropertyCard({ 
  property, 
  showDescription = true 
}: PropertyCardProps) {
  return (
    <div className="border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow h-full flex flex-col">
      {/* Property Image */}
      <div className="relative h-48 w-full">
        {property.bilder && property.bilder.length > 0 ? (
          <img 
            src={property.bilder[0]} 
            alt={property.namn} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <p className="text-gray-500">Bild saknas</p>
          </div>
        )}
      </div>
      
      <div className="p-4 flex-grow flex flex-col">
        <h2 className="text-xl font-semibold mb-2">{property.namn}</h2>
        <p className="text-gray-600 mb-2">{property.plats}</p>
        
        {showDescription && (
          <p className="text-gray-700 mb-4 line-clamp-3 flex-grow">{property.beskrivning}</p>
        )}
        
        <div className="mt-auto">
          <div className="flex justify-between items-center">
            <p className="text-lg font-bold">{property.prisPerNatt} kr/natt</p>
            <Link
              href={`/properties/${property._id}`}
              className="text-blue-500 hover:text-blue-700"
            >
              Visa detaljer
            </Link>
          </div>
          
          <div className="mt-2 text-sm">
            {property.tillganglighet ? (
              <span className="text-green-500">Tillgänglig</span>
            ) : (
              <span className="text-red-500">Inte tillgänglig</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 