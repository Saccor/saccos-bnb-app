import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import mongoose from 'mongoose';
import Property, { PropertyStatus } from '@/models/Property';
import { authMiddleware, roleMiddleware, verifyToken } from '@/lib/auth';
import { UserRole } from '@/models/User';
import { canViewProperty } from '@/lib/propertyVisibility';
import logger from '@/lib/logger';
import { validatePropertyData } from '@/lib/validationUtils';

// GET /api/properties/[id] - Get a specific property
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    // Validate ObjectId
    if (!mongoose.isValidObjectId(params.id)) {
      return NextResponse.json(
        { message: 'Ogiltigt ID-format' },
        { status: 400 }
      );
    }
    
    const property = await Property.findById(params.id).populate('agare', 'namn epost');
    
    if (!property) {
      return NextResponse.json(
        { message: 'Egendomen hittades inte' },
        { status: 404 }
      );
    }
    
    // Check if user is authenticated and has permission to view this property
    const token = request.headers.get('authorization')?.split(' ')[1];
    const userData = token ? await verifyToken(token) : null;
    
    // Check if user can view the property using our utility
    if (canViewProperty(userData, property)) {
      return NextResponse.json(property);
    }
    
    // If we reach here, the user doesn't have permission to view this property
    return NextResponse.json(
      { message: 'Denna egendom är inte tillgänglig' },
      { status: 403 }
    );
  } catch (error) {
    logger.error('Error fetching property:', error);
    return NextResponse.json(
      { message: 'Kunde inte hämta egendomen' },
      { status: 500 }
    );
  }
}

// PUT /api/properties/[id] - Update a property
export const PUT = authMiddleware(async (
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
    
    // Get the property to check ownership
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
    
    const data = await request.json();
    
    // Validate property data using our validation utility
    const validation = validatePropertyData(data);
    if (!validation.valid) {
      return NextResponse.json(
        { message: validation.error },
        { status: 400 }
      );
    }
    
    // Update the property
    const updateData: any = {
      namn: data.namn,
      beskrivning: data.beskrivning,
      plats: data.plats,
      prisPerNatt: data.prisPerNatt,
      tillganglighet: data.tillganglighet !== undefined ? data.tillganglighet : property.tillganglighet,
      bilder: data.bilder || property.bilder,
      uppdateradDatum: new Date()
    };
    
    // If a regular user is updating their property, it needs to go back to pending review
    if (user.roll === UserRole.USER && property.status === PropertyStatus.ACTIVE) {
      updateData.status = PropertyStatus.PENDING_REVIEW;
    }
    
    const updatedProperty = await Property.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true }
    ).populate('agare', 'namn epost');
    
    return NextResponse.json(updatedProperty);
  } catch (error) {
    logger.error('Error updating property:', error);
    return NextResponse.json(
      { message: 'Kunde inte uppdatera egendomen' },
      { status: 500 }
    );
  }
});

// DELETE /api/properties/[id] - Delete a property
export const DELETE = authMiddleware(async (
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
    
    // Get the property to check ownership
    const property = await Property.findById(params.id);
    
    if (!property) {
      return NextResponse.json(
        { message: 'Egendomen hittades inte' },
        { status: 404 }
      );
    }
    
    // Check if user has permission to delete this property
    if (!property.canEdit(user._id, user.roll)) {
      return NextResponse.json(
        { message: 'Du har inte behörighet att ta bort denna egendom' },
        { status: 403 }
      );
    }
    
    // Delete the property
    await Property.findByIdAndDelete(params.id);
    
    return NextResponse.json({
      message: 'Egendomen borttagen'
    });
  } catch (error) {
    console.error('Error deleting property:', error);
    return NextResponse.json(
      { message: 'Kunde inte ta bort egendomen' },
      { status: 500 }
    );
  }
}); 