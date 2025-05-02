import { CustomerInfo } from '@/components/CustomerInfoForm';
import { PropertyStatus } from '@/models/Property';

/**
 * Property validation functions
 */
export function validatePropertyData(data: any): { valid: boolean; error?: string } {
  // Check required fields
  if (!data.namn || !data.beskrivning || !data.plats || !data.prisPerNatt) {
    return { 
      valid: false, 
      error: 'Alla obligatoriska fält måste fyllas i (namn, beskrivning, plats, pris per natt)' 
    };
  }

  // Validate price
  if (isNaN(data.prisPerNatt) || data.prisPerNatt <= 0) {
    return { 
      valid: false, 
      error: 'Pris per natt måste vara ett positivt nummer' 
    };
  }

  return { valid: true };
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

/**
 * Verify a property status is valid
 */
export function isValidPropertyStatus(status: string): boolean {
  return Object.values(PropertyStatus).includes(status as PropertyStatus);
}

/**
 * Clean and format a property status to ensure consistency
 */
export function formatPropertyStatus(status: string): PropertyStatus {
  const normalizedStatus = status.toUpperCase().replace(/-/g, '_');
  
  if (isValidPropertyStatus(normalizedStatus)) {
    return normalizedStatus as PropertyStatus;
  }
  
  // Default fallback
  return PropertyStatus.PENDING_REVIEW;
} 