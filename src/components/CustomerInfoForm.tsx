'use client';

import { useState, useEffect } from 'react';

export interface CustomerInfo {
  fornamn: string;
  efternamn: string;
  telefon: string;
  epost: string;
}

interface CustomerInfoFormProps {
  customerInfo: CustomerInfo;
  onChange: (info: CustomerInfo) => void;
  disabled?: boolean;
}

export default function CustomerInfoForm({ 
  customerInfo, 
  onChange, 
  disabled = false 
}: CustomerInfoFormProps) {
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedInfo = {
      ...customerInfo,
      [name]: value
    };
    onChange(updatedInfo);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Förnamn</label>
        <input
          type="text"
          name="fornamn"
          value={customerInfo.fornamn}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
          disabled={disabled}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Efternamn</label>
        <input
          type="text"
          name="efternamn"
          value={customerInfo.efternamn}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
          disabled={disabled}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Telefon</label>
        <input
          type="tel"
          name="telefon"
          value={customerInfo.telefon}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
          disabled={disabled}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">E-post</label>
        <input
          type="email"
          name="epost"
          value={customerInfo.epost}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
          disabled={disabled}
        />
      </div>
    </div>
  );
} 