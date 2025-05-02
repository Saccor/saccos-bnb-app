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

/**
 * Validate booking dates
 * @returns An error message if validation fails, or null if valid
 */
export function validateDates(checkInDate: string, checkOutDate: string): string | null {
  if (!checkInDate || !checkOutDate) {
    return 'Både inchecknings- och utcheckningsdatum måste anges';
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const startDate = new Date(checkInDate);
  const endDate = new Date(checkOutDate);
  
  if (startDate < today) {
    return 'Incheckningsdatum kan inte vara i det förflutna';
  }
  
  if (startDate >= endDate) {
    return 'Utcheckningsdatum måste vara efter incheckningsdatum';
  }
  
  return null;
}

/**
 * Validate customer information
 * @returns An error message if validation fails, or null if valid
 */
export function validateCustomerInfo(customerInfo: CustomerInfo): string | null {
  if (!customerInfo.fornamn || !customerInfo.efternamn || !customerInfo.telefon || !customerInfo.epost) {
    return 'Alla kunduppgifter måste fyllas i';
  }
  
  // Validate email format
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(customerInfo.epost)) {
    return 'Ogiltig e-postadress';
  }
  
  // Validate phone format - simple validation for now
  const phoneRegex = /^[0-9+\s-]{6,20}$/;
  if (!phoneRegex.test(customerInfo.telefon)) {
    return 'Ogiltigt telefonnummer';
  }
  
  return null;
} 