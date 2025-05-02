import { PropertyStatus } from '@/models/Property';
import { UserRole } from '@/models/User';

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
    if (user.roll === UserRole.ADMIN || user.roll === UserRole.LISTING_AGENT) {
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
  if (user.roll === UserRole.ADMIN || user.roll === UserRole.LISTING_AGENT) {
    return true;
  }
  
  // Property owners can view their own properties
  if (property.agare._id && property.agare._id.toString() === user._id) {
    return true;
  }
  
  // Users can view pending_review properties
  if (property.status === PropertyStatus.PENDING_REVIEW) {
    return true;
  }
  
  return false;
} 