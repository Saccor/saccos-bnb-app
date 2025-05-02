import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import mongoose from 'mongoose';
import Property, { PropertyStatus } from '@/models/Property';
import { authMiddleware, roleMiddleware } from '@/lib/auth';
import { UserRole } from '@/models/User';

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
    
    // Check if user is authenticated and has permission to view non-active properties
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (token) {
      const { verifyToken } = await import('@/lib/auth');
      const userData = await verifyToken(token);
      
      if (userData) {
        // Admin and listing agents can view all properties
        if (userData.roll === UserRole.ADMIN || userData.roll === UserRole.LISTING_AGENT) {
          return NextResponse.json(property);
        }
        
        // Property owners can view their own properties
        if (property.agare._id.toString() === userData._id) {
          return NextResponse.json(property);
        }
        
        // All authenticated users can see pending_review properties
        if (property.status === PropertyStatus.PENDING_REVIEW) {
          return NextResponse.json(property);
        }
      }
    }
    
    // For non-authenticated users or users without permission, only return active properties
    if (property.status !== PropertyStatus.ACTIVE) {
      return NextResponse.json(
        { message: 'Egendomen hittades inte' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(property);
  } catch (error) {
    console.error('Error fetching property:', error);
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
    
    // Validate required fields
    const requiredFields = ['namn', 'beskrivning', 'plats', 'prisPerNatt'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { message: `Fältet '${field}' är obligatoriskt` },
          { status: 400 }
        );
      }
    }
    
    // Ensure price is a number
    if (typeof data.prisPerNatt !== 'number' || data.prisPerNatt < 0) {
      return NextResponse.json(
        { message: 'Pris per natt måste vara ett positivt nummer' },
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
    console.error('Error updating property:', error);
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