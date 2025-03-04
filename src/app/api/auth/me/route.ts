import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      console.log('No token provided in /api/auth/me');
      return NextResponse.json(
        { message: 'Ingen token tillhandahållen' },
        { status: 401 }
      );
    }
    
    console.log('Token received in /api/auth/me:', token.substring(0, 10) + '...');
    
    const userData = await verifyToken(token);
    
    if (!userData) {
      console.log('Invalid token or user not found in /api/auth/me');
      return NextResponse.json(
        { message: 'Ogiltig token' },
        { status: 401 }
      );
    }
    
    // Return user data without sensitive information
    // Use a type assertion to handle potential losenord property
    const userWithoutPassword = { ...userData };
    if ('losenord' in userWithoutPassword) {
      delete (userWithoutPassword as any).losenord;
    }
    
    // Log the user data for debugging
    console.log('User data from /api/auth/me:', userWithoutPassword);
    
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json(
      { message: 'Kunde inte hämta användarinformation' },
      { status: 500 }
    );
  }
} 