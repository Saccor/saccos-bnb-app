import { PropertyStatus } from '@/models/Property';
import { UserRole } from '@/models/User';

/**
 * Helper function to check if user has a specific role (case-insensitive)
 */
function hasRole(user: any, role: UserRole): boolean {
  if (!user || !user.roll) return false;
  
  const userRole = typeof user.roll === 'string' ? user.roll.toUpperCase() : user.roll;
  return userRole === role || userRole === role.toString();
}

/**
 * Creates a MongoDB query filter for property visibility based on user role
 * @param user The authenticated user object (or null if not authenticated)
 * @param requestedStatus Optional specific status filter from the query params
 * @returns A MongoDB query object
 */
export function getPropertyVisibilityFilter(user: any | null, requestedStatus?: string | null): any {
  // Start with empty query
  const query: any = {};
  
  if (user) {
    // Authenticated user
    const isAdmin = hasRole(user, UserRole.ADMIN);
    const isListingAgent = hasRole(user, UserRole.LISTING_AGENT);
    
    if (isAdmin || isListingAgent) {
      // Admin and listing agents can see all properties
      if (requestedStatus) {
        query.status = requestedStatus;
      }
    } else {
      // Regular users can see active properties, pending properties, and their own properties
      if (requestedStatus) {
        query.status = requestedStatus;
      } else {
        query.$or = [
          { status: PropertyStatus.ACTIVE },
          { status: PropertyStatus.PENDING_REVIEW },
          { agare: user._id }
        ];
      }
    }
  } else {
    // Unauthenticated user - only show active properties
    query.status = PropertyStatus.ACTIVE;
  }
  
  return query;
}

/**
 * Checks if a user can view a specific property
 * @param user The authenticated user object (or null if not authenticated)
 * @param property The property to check visibility for
 * @returns True if the user can view the property, false otherwise
 */
export function canViewProperty(user: any | null, property: any): boolean {
  if (!property) return false;
  
  // If property is active, anyone can view it
  if (property.status === PropertyStatus.ACTIVE) {
    return true;
  }
  
  // If no user, only active properties are visible
  if (!user) {
    return false;
  }
  
  // Admin and listing agents can view all properties
  const isAdmin = hasRole(user, UserRole.ADMIN);
  const isListingAgent = hasRole(user, UserRole.LISTING_AGENT);
  
  if (isAdmin || isListingAgent) {
    return true;
  }
  
  // Property owners can view their own properties
  // Handle both populated and unpopulated agare
  let isOwner = false;
  if (property.agare) {
    if (typeof property.agare === 'string') {
      isOwner = property.agare === user._id;
    } else if (property.agare._id) {
      isOwner = property.agare._id.toString() === user._id;
    }
  }
  
  if (isOwner) {
    return true;
  }
  
  // Users can view pending_review properties
  if (property.status === PropertyStatus.PENDING_REVIEW) {
    return true;
  }
  
  return false;
} 