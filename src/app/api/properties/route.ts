import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Property, { PropertyStatus } from '@/models/Property';
import { verifyToken, authMiddleware } from '@/lib/auth';
import { UserRole } from '@/models/User';

// GET /api/properties - Get all properties
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/properties - Starting request');
    await connectToDatabase();
    console.log('Database connected');
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const query: any = {};
    
    // Get user data if authenticated
    const token = request.headers.get('authorization')?.split(' ')[1];
    const user = token ? await verifyToken(token) : null;
    console.log('User authenticated:', !!user);
    
    // Filter by availability if specified
    const tillganglighet = searchParams.get('tillganglighet');
    if (tillganglighet !== null) {
      query.tillganglighet = tillganglighet === 'true';
    }
    
    // Handle property visibility based on user role
    const status = searchParams.get('status');
    if (user) {
      // Authenticated user
      if (user.roll === UserRole.ADMIN || user.roll === UserRole.LISTING_AGENT) {
        // Admin and listing agents can see all properties
        if (status) {
          query.status = status;
        }
      } else {
        // Regular users can see active properties, pending properties, and their own properties
        if (status) {
          query.status = status;
        } else {
          query.$or = [
            { status: PropertyStatus.ACTIVE },
            { status: PropertyStatus.PENDING_REVIEW },
            { agare: user._id }
          ];
        }
      }
    } else {
      // Unauthenticated user - only show active properties
      query.status = PropertyStatus.ACTIVE;
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
    
    // Filter by owner if specified
    const agare = searchParams.get('agare');
    if (agare && user) {
      // Only allow owner filtering for admin, listing agents, or the owner themselves
      if (user.roll === UserRole.ADMIN || user.roll === UserRole.LISTING_AGENT || user._id.toString() === agare) {
        query.agare = agare;
      }
    }
    
    // Pagination parameters
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const skip = (page - 1) * limit;
    
    console.log('Final query parameters:', { query, limit, page, skip });
    
    // Get total count for pagination
    const total = await Property.countDocuments(query);
    console.log('Total properties found:', total);
    
    // Get properties with pagination
    const properties = await Property.find(query)
      .populate('agare', 'namn epost')
      .sort({ skapadDatum: -1 })
      .skip(skip)
      .limit(limit);
    
    console.log('Properties fetched:', properties.length);
    if (properties.length > 0) {
      console.log('Sample property:', {
        id: properties[0]._id,
        namn: properties[0].namn,
        status: properties[0].status
      });
    }
    
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
      { message: 'Kunde inte hämta egendomar', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// POST /api/properties - Create a new property
export const POST = authMiddleware(async (request: NextRequest, user: any) => {
  try {
    await connectToDatabase();
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
    
    // Determine initial status based on user role
    let initialStatus = PropertyStatus.PENDING_REVIEW;
    if (user.roll === UserRole.ADMIN || user.roll === UserRole.LISTING_AGENT) {
      initialStatus = PropertyStatus.ACTIVE;
    }
    
    // Create new property
    const newProperty = new Property({
      ...data,
      agare: user._id,
      status: initialStatus,
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
}); 