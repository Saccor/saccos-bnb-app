import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { adminMiddleware } from '@/lib/auth';
import User from '@/models/User';

// This endpoint allows an admin to make another user an admin
// POST /api/auth/make-admin
async function handler(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.userId) {
      return NextResponse.json(
        { message: 'Användar-ID krävs' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Find the user
    const user = await User.findById(data.userId);
    
    if (!user) {
      return NextResponse.json(
        { message: 'Användaren hittades inte' },
        { status: 404 }
      );
    }
    
    // Update user to admin
    user.isAdmin = true;
    await user.save();
    
    return NextResponse.json({
      message: 'Användaren har fått administratörsbehörighet',
      user: {
        _id: user._id,
        namn: user.namn,
        epost: user.epost,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Error making user admin:', error);
    return NextResponse.json(
      { message: 'Kunde inte uppdatera användaren' },
      { status: 500 }
    );
  }
}

// Wrap the handler with adminMiddleware to ensure only admins can access it
export const POST = adminMiddleware(handler); 