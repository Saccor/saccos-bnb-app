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
  context: any
) => {
  console.log("Toggle-availability request received with context:", context);
  
  // Safety check for params
  if (!context || !context.params || !context.params.id) {
    console.error("Missing params in context:", context);
    return NextResponse.json(
      { message: 'Ogiltigt context eller saknas id i params', success: false },
      { status: 400 }
    );
  }
  
  const { params } = context;
  
  try {
    // Validate ObjectId
    if (!mongoose.isValidObjectId(params.id)) {
      return NextResponse.json(
        { message: 'Ogiltigt ID-format', success: false },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Get the property
    const property = await Property.findById(params.id);
    
    if (!property) {
      return NextResponse.json(
        { message: 'Egendomen hittades inte', success: false },
        { status: 404 }
      );
    }
    
    // Check if user has permission to edit this property
    if (!property.canEdit(user._id, user.roll)) {
      return NextResponse.json(
        { message: 'Du har inte behörighet att uppdatera denna egendom', success: false },
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
      property: property.toObject(),
      success: true
    });
  } catch (error) {
    logger.error('Error toggling property availability:', error);
    return NextResponse.json(
      { message: 'Kunde inte uppdatera egendomens tillgänglighet', success: false },
      { status: 500 }
    );
  }
}); 