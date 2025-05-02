// Utility functions for property pages

/**
 * Fetches the current user data from the API
 * @param token The authentication token
 * @returns The user data or null if not authenticated
 */
export async function fetchCurrentUser(token: string | null) {
  if (!token) return null;
  
  try {
    const response = await fetch('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (!response.ok) return null;
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

/**
 * Fetches property data by ID
 * @param propertyId The ID of the property to fetch
 * @param token Optional authentication token
 * @returns The property data or null if not found
 */
export async function fetchPropertyById(propertyId: string, token?: string | null) {
  try {
    const headers: HeadersInit = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(`/api/properties/${propertyId}`, {
      headers
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Egendomen hittades inte');
      }
      throw new Error('Kunde inte hämta egendomen');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching property:', error);
    throw error;
  }
}

/**
 * Checks if a user is authorized to edit a property
 * @param userData The user data
 * @param propertyData The property data
 * @returns True if the user is authorized, false otherwise
 */
export function isAuthorizedToEdit(userData: any, propertyData: any) {
  if (!userData || !propertyData) {
    console.log('isAuthorizedToEdit: Missing user or property data');
    return false;
  }
  
  console.log('isAuthorizedToEdit - Checking authorization with:', { 
    userId: userData._id,
    userRole: userData.roll,
    propertyOwner: typeof propertyData.agare === 'object' 
      ? propertyData.agare._id || propertyData.agare.id || 'Unknown' 
      : propertyData.agare || 'Unknown'
  });
  
  // Properly check if user is admin (case insensitive)
  const isAdmin = userData.roll === 'ADMIN' || userData.roll === 'admin';
  
  // Check if user is the owner
  let isOwner = false;
  
  // Handle both _id and string representation for owner comparison
  if (propertyData.agare) {
    if (typeof propertyData.agare === 'string') {
      isOwner = userData._id === propertyData.agare;
    } else if (propertyData.agare._id) {
      isOwner = userData._id === propertyData.agare._id;
    }
  }
  
  const authorized = isOwner || isAdmin;
  console.log('isAuthorizedToEdit - Result:', { isAdmin, isOwner, authorized });
  
  // User is authorized if they are the owner or an admin
  return authorized;
}

/**
 * Loading spinner component (as JSX string to be used in multiple components)
 */
export const LoadingSpinner = `
  <div className="flex justify-center items-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
`; 