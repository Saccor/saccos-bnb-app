'use client';

import { useState, useEffect } from 'react';

interface DateRangePickerProps {
  checkInDate: string;
  checkOutDate: string;
  onCheckInChange: (date: string) => void;
  onCheckOutChange: (date: string) => void;
  disabled?: boolean;
}

export default function DateRangePicker({
  checkInDate,
  checkOutDate,
  onCheckInChange,
  onCheckOutChange,
  disabled = false
}: DateRangePickerProps) {
  
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

  const handleCheckInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onCheckInChange(e.target.value);
  };

  const handleCheckOutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onCheckOutChange(e.target.value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Incheckningsdatum</label>
        <input
          type="date"
          value={checkInDate}
          onChange={handleCheckInChange}
          min={getMinDate()}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
          disabled={disabled}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Utcheckningsdatum</label>
        <input
          type="date"
          value={checkOutDate}
          onChange={handleCheckOutChange}
          min={getMinCheckOutDate()}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
          disabled={disabled}
        />
      </div>
    </div>
  );
} 