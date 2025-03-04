import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import mongoose from 'mongoose';
import { verifyToken } from '@/lib/auth';

// Define the Property model
const PropertySchema = new mongoose.Schema({
  namn: { type: String, required: true },
  beskrivning: { type: String, required: true },
  plats: { type: String, required: true },
  prisPerNatt: { type: Number, required: true },
  tillganglighet: { type: Boolean, default: true },
  agare: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  skapadDatum: { type: Date, default: Date.now },
  uppdateradDatum: { type: Date, default: Date.now }
});

// Get the Property model (or create it if it doesn't exist)
const getPropertyModel = () => {
  return mongoose.models.Property || mongoose.model('Property', PropertySchema);
};

// GET /api/properties/[id] - Get a specific property
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const Property = getPropertyModel();
    
    // Validate ObjectId
    if (!mongoose.isValidObjectId(params.id)) {
      return NextResponse.json(
        { message: 'Ogiltigt ID-format' },
        { status: 400 }
      );
    }
    
    const property = await Property.findById(params.id);
    
    if (!property) {
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
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { message: 'Autentisering krävs' },
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
    
    // Validate ObjectId
    if (!mongoose.isValidObjectId(params.id)) {
      return NextResponse.json(
        { message: 'Ogiltigt ID-format' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    const Property = getPropertyModel();
    
    // Get the property to check ownership
    const property = await Property.findById(params.id);
    
    if (!property) {
      return NextResponse.json(
        { message: 'Egendomen hittades inte' },
        { status: 404 }
      );
    }
    
    // Check if user is owner or admin
    const isOwner = property.agare.toString() === userData._id.toString();
    const isAdmin = userData.roll === 'admin';
    
    if (!isOwner && !isAdmin) {
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
    const updateData = {
      namn: data.namn,
      beskrivning: data.beskrivning,
      plats: data.plats,
      prisPerNatt: data.prisPerNatt,
      tillganglighet: data.tillganglighet !== undefined ? data.tillganglighet : property.tillganglighet,
      uppdateradDatum: new Date()
    };
    
    const updatedProperty = await Property.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true }
    );
    
    return NextResponse.json(updatedProperty);
  } catch (error) {
    console.error('Error updating property:', error);
    return NextResponse.json(
      { message: 'Kunde inte uppdatera egendomen' },
      { status: 500 }
    );
  }
}

// DELETE /api/properties/[id] - Delete a property
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { message: 'Autentisering krävs' },
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
    
    // Validate ObjectId
    if (!mongoose.isValidObjectId(params.id)) {
      return NextResponse.json(
        { message: 'Ogiltigt ID-format' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    const Property = getPropertyModel();
    
    // Get the property to check ownership
    const property = await Property.findById(params.id);
    
    if (!property) {
      return NextResponse.json(
        { message: 'Egendomen hittades inte' },
        { status: 404 }
      );
    }
    
    // Check if user is owner or admin
    const isOwner = property.agare.toString() === userData._id.toString();
    const isAdmin = userData.roll === 'admin';
    
    if (!isOwner && !isAdmin) {
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
} 