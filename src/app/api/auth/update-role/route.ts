import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import mongoose from 'mongoose';
import { adminMiddleware } from '@/lib/auth';
import User, { UserRole } from '@/models/User';

/**
 * POST /api/auth/update-role - Update a user's role
 * This endpoint allows an admin to change a user's role to USER, ADMIN, or LISTING_AGENT
 * Request body: { userId: string, role: UserRole }
 */
export const POST = adminMiddleware(async (request: NextRequest) => {
  try {
    const data = await request.json();
    const { userId, role } = data;
    
    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { message: 'Användar-ID krävs' },
        { status: 400 }
      );
    }
    
    // Validate role
    if (!role || !Object.values(UserRole).includes(role)) {
      return NextResponse.json(
        { message: 'Ogiltig roll. Måste vara USER, ADMIN, eller LISTING_AGENT' },
        { status: 400 }
      );
    }
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { message: 'Ogiltigt användar-ID format' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Find the user
    const targetUser = await User.findById(userId);
    
    if (!targetUser) {
      return NextResponse.json(
        { message: 'Användaren hittades inte' },
        { status: 404 }
      );
    }
    
    // Update user role
    targetUser.roll = role;
    targetUser.uppdateradDatum = new Date();
    await targetUser.save();
    
    return NextResponse.json({
      message: `Användarrollen har uppdaterats till ${role}`,
      user: {
        _id: targetUser._id,
        namn: targetUser.namn,
        epost: targetUser.epost,
        roll: targetUser.roll
      }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { message: 'Kunde inte uppdatera användarens roll' },
      { status: 500 }
    );
  }
}); 