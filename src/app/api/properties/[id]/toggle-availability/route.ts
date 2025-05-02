import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import mongoose from 'mongoose';
import Property, { IProperty } from '@/models/Property';
import { authMiddleware } from '@/lib/auth';
import logger from '@/lib/logger';

/**
 * POST /api/properties/[id]/toggle-availability - Toggle property availability
 * This endpoint allows property owners and admins to quickly toggle the availability of a property
 */
export const POST = authMiddleware(async (
  request: NextRequest,
  user: any,
  { params }: { params: { id: string } }
) => {
  try {
    // Validate ObjectId
    if (!mongoose.isValidObjectId(params.id)) {
      return NextResponse.json(
        { message: 'Ogiltigt ID-format' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Get the property
    const property = await Property.findById(params.id);
    
    if (!property) {
      return NextResponse.json(
        { message: 'Egendomen hittades inte' },
        { status: 404 }
      );
    }
    
    // Check if user has permission to edit this property
    if (!property.canEdit(user._id, user.roll)) {
      return NextResponse.json(
        { message: 'Du har inte behörighet att uppdatera denna egendom' },
        { status: 403 }
      );
    }
    
    // Toggle availability
    const newAvailability = !property.tillganglighet;
    
    // Update the property
    property.tillganglighet = newAvailability;
    property.uppdateradDatum = new Date();
    await property.save();
    
    return NextResponse.json({
      message: `Egendomen är nu ${newAvailability ? 'tillgänglig' : 'inte tillgänglig'}`,
      property
    });
  } catch (error) {
    logger.error('Error toggling property availability:', error);
    return NextResponse.json(
      { message: 'Kunde inte uppdatera egendomens tillgänglighet' },
      { status: 500 }
    );
  }
}); 