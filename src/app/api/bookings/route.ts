import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import mongoose from 'mongoose';
import { authMiddleware, roleMiddleware } from '@/lib/auth';
import { UserRole } from '@/models/User';

// Import models
import Property, { PropertyStatus } from '@/models/Property';
import Booking, { BookingStatus } from '@/models/Booking';

// GET /api/bookings - Get all bookings for the current user
export const GET = authMiddleware(async (request: NextRequest, user: any) => {
  try {
    await connectToDatabase();
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const propertyId = searchParams.get('propertyId');
    const status = searchParams.get('status');
    
    // Build query based on user role
    let query: any = {};
    
    // Regular users can only see their own bookings
    if (user.roll === UserRole.USER) {
      query.skapadAv = user._id;
    }
    
    // Filter by property if specified
    if (propertyId) {
      query.egendom = propertyId;
    }
    
    // Filter by status if specified
    if (status) {
      query.status = status;
    }
    
    // Get bookings with appropriate population
    let bookings;
    
    if (user.roll === UserRole.ADMIN) {
      // Admins can see all bookings with full details
      bookings = await Booking.find(query)
        .populate('egendom')
        .populate('skapadAv', '-losenord')
        .sort({ skapadDatum: -1 });
    } else if (user.roll === UserRole.LISTING_AGENT) {
      // Listing agents can see bookings for their properties
      if (propertyId) {
        // If filtering by property, check if the user owns the property
        const property = await Property.findById(propertyId);
        if (property && property.agare.toString() === user._id) {
          bookings = await Booking.find(query)
            .populate('egendom')
            .populate('skapadAv', '-losenord')
            .sort({ skapadDatum: -1 });
        } else {
          bookings = [];
        }
      } else {
        // Get all properties owned by the listing agent
        const userProperties = await Property.find({ agare: user._id });
        const propertyIds = userProperties.map(p => p._id);
        
        // Get bookings for those properties
        bookings = await Booking.find({
          ...query,
          egendom: { $in: propertyIds }
        })
          .populate('egendom')
          .populate('skapadAv', '-losenord')
          .sort({ skapadDatum: -1 });
      }
    } else {
      // Regular users can only see their own bookings
      bookings = await Booking.find(query)
        .populate('egendom')
        .sort({ skapadDatum: -1 });
    }
    
    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { message: 'Kunde inte hämta bokningar' },
      { status: 500 }
    );
  }
});

// POST /api/bookings - Create a new booking
export const POST = authMiddleware(async (request: NextRequest, user: any) => {
  try {
    await connectToDatabase();
    
    const data = await request.json();
    
    // Validate required fields
    const requiredFields = ['incheckningDatum', 'utcheckningDatum', 'egendom', 'kund'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { message: `Fältet '${field}' är obligatoriskt` },
          { status: 400 }
        );
      }
    }
    
    // Validate customer fields
    const requiredCustomerFields = ['fornamn', 'efternamn', 'telefon', 'epost'];
    for (const field of requiredCustomerFields) {
      if (!data.kund[field]) {
        return NextResponse.json(
          { message: `Kundfältet '${field}' är obligatoriskt` },
          { status: 400 }
        );
      }
    }
    
    // Parse dates
    const checkInDate = new Date(data.incheckningDatum);
    const checkOutDate = new Date(data.utcheckningDatum);
    
    // Validate dates
    if (checkInDate >= checkOutDate) {
      return NextResponse.json(
        { message: 'Utcheckningsdatum måste vara efter incheckningsdatum' },
        { status: 400 }
      );
    }
    
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    if (checkInDate < now) {
      return NextResponse.json(
        { message: 'Incheckningsdatum kan inte vara i det förflutna' },
        { status: 400 }
      );
    }
    
    // Calculate number of nights
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Get property to calculate price
    const property = await Property.findById(data.egendom);
    if (!property) {
      return NextResponse.json(
        { message: 'Egendomen hittades inte' },
        { status: 404 }
      );
    }
    
    // Check if property is available and active
    if (!property.canBeBooked()) {
      return NextResponse.json(
        { message: 'Egendomen är inte tillgänglig för bokning' },
        { status: 400 }
      );
    }
    
    // Check for overlapping bookings
    const overlappingBookings = await Booking.find({
      egendom: data.egendom,
      status: { $in: [BookingStatus.PENDING, BookingStatus.ACCEPTED] },
      $or: [
        { 
          incheckningDatum: { $lte: checkOutDate },
          utcheckningDatum: { $gte: checkInDate }
        }
      ]
    });
    
    if (overlappingBookings.length > 0) {
      return NextResponse.json(
        { message: 'Egendomen är redan bokad under denna period' },
        { status: 400 }
      );
    }
    
    // Calculate total price
    const totalPris = nights * property.prisPerNatt;
    
    // Determine initial booking status based on property owner role
    let initialStatus = BookingStatus.PENDING;
    
    // If the property owner is a listing agent, the booking needs approval
    const propertyOwner = await mongoose.model('User').findById(property.agare);
    if (propertyOwner && propertyOwner.roll === UserRole.LISTING_AGENT) {
      initialStatus = BookingStatus.PENDING;
    } else {
      // For regular users or admin-owned properties, bookings are auto-accepted
      initialStatus = BookingStatus.ACCEPTED;
    }
    
    // Create booking
    const bookingData = {
      incheckningDatum: checkInDate,
      utcheckningDatum: checkOutDate,
      totalPris,
      antalNatter: nights,
      kund: data.kund,
      skapadAv: user._id,
      egendom: data.egendom,
      status: initialStatus,
      skapadDatum: new Date(),
      uppdateradDatum: new Date()
    };
    
    const booking = await Booking.create(bookingData);
    
    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);
    
    if (error instanceof Error) {
      if (error.name === 'ValidationError') {
        return NextResponse.json(
          { message: 'Valideringsfel: ' + error.message },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { message: 'Kunde inte skapa bokning' },
      { status: 500 }
    );
  }
});

// DELETE /api/bookings/:id - Cancel a booking
export const DELETE = authMiddleware(async (request: NextRequest, user: any) => {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('id');
    
    if (!bookingId) {
      return NextResponse.json(
        { message: 'Boknings-ID krävs' },
        { status: 400 }
      );
    }
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return NextResponse.json(
        { message: 'Ogiltigt boknings-ID format' },
        { status: 400 }
      );
    }
    
    // Find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.json(
        { message: 'Bokningen hittades inte' },
        { status: 404 }
      );
    }
    
    // Check if user can cancel this booking
    if (!booking.canManage(user._id, user.roll)) {
      return NextResponse.json(
        { message: 'Du har inte behörighet att avboka denna bokning' },
        { status: 403 }
      );
    }
    
    // Check if booking can be cancelled
    if (!booking.canBeCancelled()) {
      return NextResponse.json(
        { message: 'Kan inte avboka en bokning som redan har påbörjats' },
        { status: 400 }
      );
    }
    
    // Update booking status to cancelled
    booking.status = BookingStatus.CANCELLED;
    booking.uppdateradDatum = new Date();
    await booking.save();
    
    return NextResponse.json(
      { message: 'Bokningen har avbokats' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return NextResponse.json(
      { message: 'Kunde inte avboka bokningen' },
      { status: 500 }
    );
  }
}); 