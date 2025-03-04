import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import mongoose from 'mongoose';
import { verifyToken } from '@/lib/auth';

// Import models
import Property from '@/models/Property';
import Booking from '@/models/Booking';

// GET /api/bookings - Get all bookings for the current user
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      console.log('GET /api/bookings - No token provided');
      return NextResponse.json(
        { message: 'Autentisering krävs' },
        { status: 401 }
      );
    }
    
    const userData = await verifyToken(token);
    if (!userData) {
      console.log('GET /api/bookings - Invalid token');
      return NextResponse.json(
        { message: 'Ogiltig token' },
        { status: 401 }
      );
    }
    
    await connectToDatabase();
    console.log('GET /api/bookings - Connected to database');
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const propertyId = searchParams.get('propertyId');
    
    // Build query - use _id instead of userId for consistency
    const query: any = { user: userData._id };
    
    // Filter by property if specified
    if (propertyId) {
      query.egendom = propertyId;
    }
    
    console.log('GET /api/bookings - Fetching bookings with query:', query);
    
    // Get bookings for the user (or all bookings for admin)
    const bookings = userData.isAdmin && !propertyId && !searchParams.get('onlyMine')
      ? await Booking.find({}).populate('egendom').populate('user', '-losenord')
      : await Booking.find(query).populate('egendom');
    
    console.log(`GET /api/bookings - Found ${bookings.length} bookings`);
    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { message: 'Kunde inte hämta bokningar' },
      { status: 500 }
    );
  }
}

// POST /api/bookings - Create a new booking
export async function POST(request: NextRequest) {
  console.log('POST /api/bookings - Received booking request');
  try {
    // Verify authentication
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      console.log('POST /api/bookings - No token provided');
      return NextResponse.json(
        { message: 'Autentisering krävs' },
        { status: 401 }
      );
    }
    
    const userData = await verifyToken(token);
    if (!userData) {
      console.log('POST /api/bookings - Invalid token');
      return NextResponse.json(
        { message: 'Ogiltig token' },
        { status: 401 }
      );
    }
    
    console.log('POST /api/bookings - User authenticated:', userData._id);
    
    await connectToDatabase();
    console.log('POST /api/bookings - Connected to database');
    
    const data = await request.json();
    console.log('POST /api/bookings - Request data:', data);
    
    // Validate required fields
    const requiredFields = ['incheckningDatum', 'utcheckningDatum', 'egendom'];
    for (const field of requiredFields) {
      if (!data[field]) {
        console.log(`POST /api/bookings - Missing required field: ${field}`);
        return NextResponse.json(
          { message: `Fältet '${field}' är obligatoriskt` },
          { status: 400 }
        );
      }
    }
    
    // Parse dates
    const checkInDate = new Date(data.incheckningDatum);
    const checkOutDate = new Date(data.utcheckningDatum);
    
    console.log('POST /api/bookings - Dates:', { 
      checkInDate: checkInDate.toISOString(), 
      checkOutDate: checkOutDate.toISOString() 
    });
    
    // Validate dates
    if (checkInDate >= checkOutDate) {
      console.log('POST /api/bookings - Invalid dates: check-out must be after check-in');
      return NextResponse.json(
        { message: 'Utcheckningsdatum måste vara efter incheckningsdatum' },
        { status: 400 }
      );
    }
    
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    if (checkInDate < now) {
      console.log('POST /api/bookings - Invalid dates: check-in date is in the past');
      return NextResponse.json(
        { message: 'Incheckningsdatum kan inte vara i det förflutna' },
        { status: 400 }
      );
    }
    
    // Calculate number of nights
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    console.log('POST /api/bookings - Calculated nights:', nights);
    
    // Get property to calculate price
    const property = await Property.findById(data.egendom);
    if (!property) {
      console.log(`POST /api/bookings - Property not found: ${data.egendom}`);
      return NextResponse.json(
        { message: 'Egendomen hittades inte' },
        { status: 404 }
      );
    }
    
    console.log('POST /api/bookings - Property found:', { 
      id: property._id, 
      name: property.namn, 
      pricePerNight: property.prisPerNatt,
      available: property.tillganglighet
    });
    
    // Check if property is available
    if (!property.tillganglighet) {
      console.log('POST /api/bookings - Property is not available');
      return NextResponse.json(
        { message: 'Egendomen är inte tillgänglig för bokning' },
        { status: 400 }
      );
    }
    
    // Check for overlapping bookings
    const overlappingBookings = await Booking.find({
      egendom: data.egendom,
      $or: [
        { 
          incheckningDatum: { $lte: checkOutDate },
          utcheckningDatum: { $gte: checkInDate }
        }
      ]
    });
    
    if (overlappingBookings.length > 0) {
      console.log('POST /api/bookings - Overlapping bookings found:', overlappingBookings.length);
      return NextResponse.json(
        { message: 'Egendomen är redan bokad under denna period' },
        { status: 400 }
      );
    }
    
    // Calculate total price
    const totalPris = nights * property.prisPerNatt;
    console.log('POST /api/bookings - Calculated total price:', totalPris);
    
    // Create booking
    const bookingData = {
      incheckningDatum: checkInDate,
      utcheckningDatum: checkOutDate,
      totalPris,
      user: userData._id,
      egendom: data.egendom
    };
    
    console.log('POST /api/bookings - Creating booking with data:', bookingData);
    
    const booking = await Booking.create(bookingData);
    console.log('POST /api/bookings - Booking created successfully:', booking._id);
    
    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      if (error.name === 'ValidationError') {
        return NextResponse.json(
          { message: 'Valideringsfel: ' + error.message },
          { status: 400 }
        );
      }
      
      if (error.name === 'MongoError' || error.name === 'MongoServerError') {
        return NextResponse.json(
          { message: 'Databasfel: ' + error.message },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { message: 'Kunde inte skapa bokning' },
      { status: 500 }
    );
  }
}

// DELETE /api/bookings/:id - Cancel a booking
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get booking ID from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const bookingId = pathParts[pathParts.length - 1];
    
    console.log('DELETE /api/bookings/:id - Canceling booking:', bookingId);
    
    if (!bookingId || bookingId === 'bookings') {
      console.log('DELETE /api/bookings/:id - No booking ID provided');
      return NextResponse.json(
        { message: 'Boknings-ID krävs' },
        { status: 400 }
      );
    }
    
    // Verify authentication
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      console.log('DELETE /api/bookings/:id - No token provided');
      return NextResponse.json(
        { message: 'Autentisering krävs' },
        { status: 401 }
      );
    }
    
    const userData = await verifyToken(token);
    if (!userData) {
      console.log('DELETE /api/bookings/:id - Invalid token');
      return NextResponse.json(
        { message: 'Ogiltig token' },
        { status: 401 }
      );
    }
    
    await connectToDatabase();
    console.log('DELETE /api/bookings/:id - Connected to database');
    
    // Find booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      console.log('DELETE /api/bookings/:id - Booking not found');
      return NextResponse.json(
        { message: 'Bokningen hittades inte' },
        { status: 404 }
      );
    }
    
    console.log('DELETE /api/bookings/:id - Booking found:', {
      id: booking._id,
      user: booking.user,
      property: booking.egendom,
      checkIn: booking.incheckningDatum
    });
    
    // Check if user is authorized to cancel the booking
    if (booking.user.toString() !== userData._id && !userData.isAdmin) {
      console.log('DELETE /api/bookings/:id - User not authorized to cancel booking');
      return NextResponse.json(
        { message: 'Du har inte behörighet att avboka denna bokning' },
        { status: 403 }
      );
    }
    
    // Check if check-in date is in the past
    const now = new Date();
    if (new Date(booking.incheckningDatum) < now) {
      console.log('DELETE /api/bookings/:id - Cannot cancel booking in the past');
      return NextResponse.json(
        { message: 'Kan inte avboka en bokning som redan har påbörjats' },
        { status: 400 }
      );
    }
    
    // Delete booking
    await Booking.findByIdAndDelete(bookingId);
    console.log('DELETE /api/bookings/:id - Booking successfully canceled');
    
    return NextResponse.json({ message: 'Bokning avbokad' });
  } catch (error) {
    console.error('Error canceling booking:', error);
    return NextResponse.json(
      { message: 'Kunde inte avboka bokning' },
      { status: 500 }
    );
  }
} 