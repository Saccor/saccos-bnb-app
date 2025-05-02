import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectToDatabase from './db'; // Use the Mongoose connection
import mongoose from 'mongoose';
import { UserRole } from '@/models/User';

export interface DecodedToken {
  userId: string;
  roll: UserRole;
  [key: string]: any; // Allow for additional properties
}

export async function verifyToken(token: string) {
  if (!token) {
    console.log('No token provided to verifyToken');
    return null;
  }
  
  try {
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in environment variables');
      throw new Error('JWT_SECRET is not defined in environment variables');
    }
    
    console.log('Attempting to verify token:', token.substring(0, 20) + '...');
    
    // Now verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as DecodedToken;
    console.log('Verified decoded token:', decoded);
    
    if (!decoded || !decoded.userId) {
      console.error('Token is missing userId');
      return null;
    }
    
    // Connect to the database using Mongoose
    await connectToDatabase();
    
    // Get User model with proper schema
    const User = mongoose.models.User;
    if (!User) {
      console.error('User model not found');
      return null;
    }
    
    // Find user by ID
    const user = await User.findById(decoded.userId);
    if (!user) {
      console.log('User not found in database');
      return null;
    }
    
    if (!user.aktiv) {
      console.log('User account is inactive');
      return null;
    }
    
    // Update last login
    user.senastInloggning = new Date();
    await user.save();
    
    // Convert Mongoose document to plain object
    const userObject = user.toObject();
    
    // Return user data with consistent format
    return {
      ...userObject,
      _id: userObject._id.toString()
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

export async function verifyAuth(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  
  if (!token) {
    return {
      authenticated: false,
      error: 'Ingen token, åtkomst nekad'
    };
  }
  
  const user = await verifyToken(token);
  if (!user) {
    return {
      authenticated: false,
      error: 'Ogiltig token'
    };
  }
  
  return {
    authenticated: true,
    user
  };
}

export function authMiddleware(handler: Function) {
  return async (request: NextRequest) => {
    const auth = await verifyAuth(request);
    
    if (!auth.authenticated) {
      return NextResponse.json(
        { message: auth.error },
        { status: 401 }
      );
    }
    
    return handler(request, auth.user);
  };
}

export function roleMiddleware(roles: UserRole[]) {
  return (handler: Function) => {
    return async (request: NextRequest) => {
      const auth = await verifyAuth(request);
      
      if (!auth.authenticated) {
        return NextResponse.json(
          { message: auth.error },
          { status: 401 }
        );
      }
      
      if (!roles.includes(auth.user.roll)) {
        return NextResponse.json(
          { message: 'Otillräckliga behörigheter' },
          { status: 403 }
        );
      }
      
      return handler(request, auth.user);
    };
  };
}

// Convenience middleware for admin-only routes
export const adminMiddleware = roleMiddleware([UserRole.ADMIN]);

// Convenience middleware for listing agent routes
export const listingAgentMiddleware = roleMiddleware([UserRole.LISTING_AGENT, UserRole.ADMIN]); 