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

// GET /api/properties - Get all properties
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const Property = getPropertyModel();
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const query: any = {};
    
    // Filter by availability if specified
    const tillganglighet = searchParams.get('tillganglighet');
    if (tillganglighet !== null) {
      query.tillganglighet = tillganglighet === 'true';
    }
    
    // Filter by location if specified
    const plats = searchParams.get('plats');
    if (plats) {
      query.plats = { $regex: plats, $options: 'i' };
    }
    
    // Filter by price range if specified
    const minPris = searchParams.get('minPris');
    const maxPris = searchParams.get('maxPris');
    if (minPris || maxPris) {
      query.prisPerNatt = {};
      if (minPris) query.prisPerNatt.$gte = parseInt(minPris);
      if (maxPris) query.prisPerNatt.$lte = parseInt(maxPris);
    }
    
    // Pagination parameters
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const skip = (page - 1) * limit;
    
    // Get total count for pagination
    const total = await Property.countDocuments(query);
    
    // Get properties with pagination
    const properties = await Property.find(query)
      .sort({ skapadDatum: -1 })
      .skip(skip)
      .limit(limit);
    
    return NextResponse.json({
      properties,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching properties:', error);
    return NextResponse.json(
      { message: 'Kunde inte hämta egendomar' },
      { status: 500 }
    );
  }
}

// POST /api/properties - Create a new property
export async function POST(request: NextRequest) {
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
    
    await connectToDatabase();
    const Property = getPropertyModel();
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
    
    // Set default availability if not provided
    if (data.tillganglighet === undefined) {
      data.tillganglighet = true;
    }
    
    // Create new property
    const newProperty = new Property({
      ...data,
      agare: userData._id,
      skapadDatum: new Date(),
      uppdateradDatum: new Date()
    });
    
    await newProperty.save();
    
    return NextResponse.json(
      newProperty,
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating property:', error);
    return NextResponse.json(
      { message: 'Kunde inte skapa egendomen' },
      { status: 500 }
    );
  }
} 