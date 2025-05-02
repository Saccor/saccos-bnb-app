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
        { message: 'Ogiltigt ID-format', success: false },
        { status: 400 }
      );
    }
    
    const property = await Property.findById(params.id).populate('agare', 'namn epost');
    
    if (!property) {
      return NextResponse.json(
        { message: 'Egendomen hittades inte', success: false },
        { status: 404 }
      );
    }
    
    // Check if user is authenticated and has permission to view this property
    const token = request.headers.get('authorization')?.split(' ')[1];
    const userData = token ? await verifyToken(token) : null;
    
    // Check if user can view the property using our utility
    if (canViewProperty(userData, property)) {
      return NextResponse.json({
        ...property.toObject(),
        success: true
      });
    }
    
    // If we reach here, the user doesn't have permission to view this property
    return NextResponse.json(
      { message: 'Denna egendom är inte tillgänglig', success: false },
      { status: 403 }
    );
  } catch (error) {
    logger.error('Error fetching property:', error);
    return NextResponse.json(
      { message: 'Kunde inte hämta egendomen', success: false },
      { status: 500 }
    );
  }
}

// PUT /api/properties/[id] - Update a property
export const PUT = authMiddleware(async (
  request: NextRequest,
  user: any,
  context: any
) => {
  console.log("PUT request received for property with context:", context);
  
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
    
    // Get the property to check ownership
    const property = await Property.findById(params.id);
    
    if (!property) {
      return NextResponse.json(
        { message: 'Egendomen hittades inte', success: false },
        { status: 404 }
      );
    }
    
    console.log('Property update permission check:', {
      userId: user._id,
      userRole: user.roll,
      propertyOwner: property.agare.toString(),
      canEdit: property.canEdit(user._id, user.roll)
    });
    
    // Check if user has permission to edit this property
    if (!property.canEdit(user._id, user.roll)) {
      return NextResponse.json(
        { 
          message: 'Du har inte behörighet att uppdatera denna egendom',
          debug: {
            userId: user._id,
            userRole: user.roll,
            propertyOwner: property.agare.toString()
          },
          success: false
        },
        { status: 403 }
      );
    }
    
    const data = await request.json();
    
    // Validate property data using our validation utility
    const validation = validatePropertyData(data);
    if (!validation.valid) {
      return NextResponse.json(
        { message: validation.error, success: false },
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
    const isAdmin = user.roll === UserRole.ADMIN || user.roll === 'admin';
    if (!isAdmin && property.status === PropertyStatus.ACTIVE) {
      updateData.status = PropertyStatus.PENDING_REVIEW;
    }
    
    const updatedProperty = await Property.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true }
    ).populate('agare', 'namn epost');
    
    if (!updatedProperty) {
      return NextResponse.json(
        { message: 'Egendom hittades inte efter uppdatering', success: false },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      ...updatedProperty.toObject(),
      success: true
    });
  } catch (error) {
    logger.error('Error updating property:', error);
    return NextResponse.json(
      { message: 'Kunde inte uppdatera egendomen', success: false },
      { status: 500 }
    );
  }
});

// DELETE /api/properties/[id] - Delete a property
export const DELETE = authMiddleware(async (
  request: NextRequest,
  user: any,
  context: any
) => {
  console.log("DELETE request received for property with context:", context);
  
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
    
    // Get the property to check ownership
    const property = await Property.findById(params.id);
    
    if (!property) {
      return NextResponse.json(
        { message: 'Egendomen hittades inte', success: false },
        { status: 404 }
      );
    }
    
    // Check if user has permission to delete this property
    if (!property.canEdit(user._id, user.roll)) {
      return NextResponse.json(
        { message: 'Du har inte behörighet att ta bort denna egendom', success: false },
        { status: 403 }
      );
    }
    
    // Delete the property
    await Property.findByIdAndDelete(params.id);
    
    return NextResponse.json({
      message: 'Egendomen borttagen',
      success: true
    });
  } catch (error) {
    console.error('Error deleting property:', error);
    return NextResponse.json(
      { message: 'Kunde inte ta bort egendomen', success: false },
      { status: 500 }
    );
  }
}); 