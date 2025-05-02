import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json(
        { message: 'Ingen token tillhandahållen', success: false },
        { status: 401 }
      );
    }
    
    const userData = await verifyToken(token);
    
    if (!userData) {
      return NextResponse.json(
        { message: 'Ogiltig token', success: false },
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
      },
      success: true
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { message: 'Autentiseringsfel', success: false },
      { status: 500 }
    );
  }
} 