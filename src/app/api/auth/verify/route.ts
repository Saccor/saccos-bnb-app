import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json(
        { message: 'Ingen token tillhandahållen' },
        { status: 401 }
      );
    }
    
    const userData = await verifyToken(token);
    
    if (!userData) {
      return NextResponse.json(
        { message: 'Ogiltig token' },
        { status: 401 }
      );
    }
    
    // Return success with minimal user data
    return NextResponse.json({
      authenticated: true,
      user: {
        _id: userData._id,
        namn: userData.namn,
        epost: userData.epost,
        roll: userData.roll
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { message: 'Autentiseringsfel' },
      { status: 500 }
    );
  }
} 