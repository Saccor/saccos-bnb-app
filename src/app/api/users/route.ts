import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import { adminMiddleware } from '@/lib/auth';

// GET /api/users - Get all users (admin only)
async function handler(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Fetch all users, excluding password field
    const users = await User.find({}).select('-losenord');
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid hämtning av användare' },
      { status: 500 }
    );
  }
}

// Wrap the handler with adminMiddleware to ensure only admins can access it
export const GET = adminMiddleware(handler); 