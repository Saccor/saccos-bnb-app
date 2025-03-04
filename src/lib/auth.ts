import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectToDatabase from './db'; // Use the Mongoose connection
import mongoose from 'mongoose';

export interface DecodedToken {
  userId: string;
  isAdmin: boolean;
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
    
    // Decode the token without verification first to inspect its structure
    try {
      const decoded = jwt.decode(token);
      console.log('Decoded token (without verification):', decoded);
    } catch (decodeError) {
      console.error('Error decoding token:', decodeError);
    }
    
    // Now verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as DecodedToken;
    console.log('Verified decoded token:', decoded);
    
    if (!decoded || !decoded.userId) {
      console.error('Token is missing userId');
      return null;
    }
    
    // Connect to the database using Mongoose
    await connectToDatabase();
    
    console.log('Looking for user with ID:', decoded.userId);
    
    // Import the User model dynamically to avoid circular dependencies
    const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
      namn: String,
      epost: String,
      losenord: String,
      isAdmin: Boolean
    }));
    
    // Try to find the user with the ID from the token
    let user;
    try {
      user = await User.findById(decoded.userId);
      console.log('User found in database:', user ? 'Yes' : 'No');
    } catch (dbError) {
      console.error('Error finding user in database:', dbError);
      return null;
    }
    
    if (!user) {
      console.log('User not found in database');
      return null;
    }
    
    // Convert Mongoose document to plain object
    const userObject = user.toObject();
    
    // Return user data with consistent format
    return {
      ...userObject,
      _id: userObject._id.toString(), // Convert ObjectId to string for consistency
      roll: userObject.isAdmin ? 'admin' : 'user' // Map isAdmin to roll for consistency
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
  
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as DecodedToken;
    return {
      authenticated: true,
      user: decoded
    };
  } catch (error) {
    return {
      authenticated: false,
      error: 'Ogiltig token'
    };
  }
}

export function authMiddleware(handler: Function) {
  return async (request: NextRequest) => {
    const authResult = await verifyAuth(request);
    
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json(
        { message: authResult.error || 'Åtkomst nekad' },
        { status: 401 }
      );
    }
    
    return handler(request, authResult.user);
  };
}

export function adminMiddleware(handler: Function) {
  return async (request: NextRequest) => {
    const authResult = await verifyAuth(request);
    
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json(
        { message: authResult.error || 'Åtkomst nekad' },
        { status: 401 }
      );
    }
    
    if (!authResult.user.isAdmin) {
      return NextResponse.json(
        { message: 'Åtkomst nekad. Administratörsbehörighet krävs.' },
        { status: 403 }
      );
    }
    
    return handler(request, authResult.user);
  };
} 