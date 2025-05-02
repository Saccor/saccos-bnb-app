import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Property, { PropertyStatus } from '@/models/Property';
import { verifyToken, authMiddleware } from '@/lib/auth';
import { UserRole } from '@/models/User';
import { getPropertyVisibilityFilter } from '@/lib/propertyVisibility';
import logger from '@/lib/logger';
import { validatePropertyData } from '@/lib/validationUtils';

// GET /api/properties - Get all properties
export async function GET(request: NextRequest) {
  try {
    logger.info('GET /api/properties - Starting request');
    await connectToDatabase();
    logger.debug('Database connected');
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const query: any = {};
    
    // Get user data if authenticated
    const token = request.headers.get('authorization')?.split(' ')[1];
    const user = token ? await verifyToken(token) : null;
    logger.debug('User authenticated:', !!user);
    
    // Filter by availability if specified
    const tillganglighet = searchParams.get('tillganglighet');
    if (tillganglighet !== null) {
      query.tillganglighet = tillganglighet === 'true';
    }
    
    // Apply property visibility filter based on user role
    const status = searchParams.get('status');
    const visibilityFilter = getPropertyVisibilityFilter(user, status);
    Object.assign(query, visibilityFilter);
    
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
    
    logger.debug('Final query parameters:', { query, limit, page, skip });
    
    // Get total count for pagination
    const total = await Property.countDocuments(query);
    logger.debug('Total properties found:', total);
    
    // Get properties with pagination
    const properties = await Property.find(query)
      .populate('agare', 'namn epost')
      .sort({ skapadDatum: -1 })
      .skip(skip)
      .limit(limit);
    
    logger.debug('Properties fetched:', properties.length);
    if (properties.length > 0) {
      logger.debug('Sample property:', {
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
    logger.error('Error fetching properties:', error);
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
    
    // Validate property data using our validation utility
    const validation = validatePropertyData(data);
    if (!validation.valid) {
      return NextResponse.json(
        { message: validation.error },
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
    logger.error('Error creating property:', error);
    return NextResponse.json(
      { message: 'Kunde inte skapa egendomen' },
      { status: 500 }
    );
  }
}); 