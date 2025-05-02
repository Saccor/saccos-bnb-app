import { CustomerInfo } from '@/components/CustomerInfoForm';

/**
 * Calculate number of nights between two dates
 */
export function calculateNights(checkInDate: string, checkOutDate: string): number {
  if (!checkInDate || !checkOutDate) return 0;
  
  const startDate = new Date(checkInDate);
  const endDate = new Date(checkOutDate);
  
  // Calculate nights
  const timeDiff = endDate.getTime() - startDate.getTime();
  const nightCount = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  
  return nightCount > 0 ? nightCount : 0;
}

/**
 * Calculate total price based on price per night and number of nights
 */
export function calculateTotalPrice(pricePerNight: number, checkInDate: string, checkOutDate: string): number {
  const nights = calculateNights(checkInDate, checkOutDate);
  return nights * pricePerNight;
} 