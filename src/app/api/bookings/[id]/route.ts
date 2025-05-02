import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import mongoose from 'mongoose';
import { authMiddleware } from '@/lib/auth';
import { UserRole } from '@/models/User';
import Booking, { BookingStatus } from '@/models/Booking';
import Property from '@/models/Property';

// GET /api/bookings/[id] - Get a specific booking
export const GET = authMiddleware(async (request: NextRequest, user: any, { params }: { params: { id: string } }) => {
  try {
    await connectToDatabase();
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { message: 'Ogiltigt boknings-ID format', success: false },
        { status: 400 }
      );
    }
    
    // Find the booking
    const booking = await Booking.findById(params.id)
      .populate('egendom')
      .populate('skapadAv', '-losenord');
    
    if (!booking) {
      return NextResponse.json(
        { message: 'Bokningen hittades inte', success: false },
        { status: 404 }
      );
    }
    
    // Check if user has permission to view this booking
    if (!booking.canManage(user._id, user.roll)) {
      // Check if user is a listing agent and owns the property
      if (user.roll === UserRole.LISTING_AGENT) {
        const property = await Property.findById(booking.egendom);
        if (property && property.agare.toString() === user._id) {
          return NextResponse.json({...booking.toObject(), success: true});
        }
      }
      
      return NextResponse.json(
        { message: 'Du har inte behörighet att se denna bokning', success: false },
        { status: 403 }
      );
    }
    
    return NextResponse.json({...booking.toObject(), success: true});
  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json(
      { message: 'Kunde inte hämta bokningen', success: false },
      { status: 500 }
    );
  }
});

// PUT /api/bookings/[id] - Update a booking (approve/reject)
export const PUT = authMiddleware(async (request: NextRequest, user: any, { params }: { params: { id: string } }) => {
  try {
    await connectToDatabase();
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { message: 'Ogiltigt boknings-ID format', success: false },
        { status: 400 }
      );
    }
    
    // Find the booking
    const booking = await Booking.findById(params.id);
    
    if (!booking) {
      return NextResponse.json(
        { message: 'Bokningen hittades inte', success: false },
        { status: 404 }
      );
    }
    
    // Get the property to check ownership
    const property = await Property.findById(booking.egendom);
    
    if (!property) {
      return NextResponse.json(
        { message: 'Egendomen hittades inte', success: false },
        { status: 404 }
      );
    }
    
    // Check if user has permission to update this booking
    if (user.roll !== UserRole.ADMIN && property.agare.toString() !== user._id) {
      return NextResponse.json(
        { message: 'Du har inte behörighet att uppdatera denna bokning', success: false },
        { status: 403 }
      );
    }
    
    // Get the update data
    const data = await request.json();
    
    // Only allow updating status and rejection reason
    if (data.status && (data.status === BookingStatus.ACCEPTED || data.status === BookingStatus.REJECTED)) {
      booking.status = data.status;
      
      if (data.status === BookingStatus.ACCEPTED) {
        booking.godkandDatum = new Date();
        booking.godkandAv = user._id;
      } else if (data.status === BookingStatus.REJECTED) {
        booking.avvisningsAnledning = data.avvisningsAnledning || 'Ingen anledning angiven';
      }
      
      booking.uppdateradDatum = new Date();
      await booking.save();
      
      return NextResponse.json({...booking.toObject(), success: true});
    } else {
      return NextResponse.json(
        { message: 'Ogiltig status eller saknad status', success: false },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json(
      { message: 'Kunde inte uppdatera bokningen', success: false },
      { status: 500 }
    );
  }
});

// DELETE /api/bookings/[id] - Cancel a booking
export const DELETE = authMiddleware(async (request: NextRequest, user: any, { params }: { params: { id: string } }) => {
  try {
    await connectToDatabase();
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { message: 'Ogiltigt boknings-ID format', success: false },
        { status: 400 }
      );
    }
    
    // Find the booking
    const booking = await Booking.findById(params.id);
    
    if (!booking) {
      return NextResponse.json(
        { message: 'Bokningen hittades inte', success: false },
        { status: 404 }
      );
    }
    
    // Check if user has permission to cancel this booking
    if (!booking.canManage(user._id, user.roll)) {
      return NextResponse.json(
        { message: 'Du har inte behörighet att avboka denna bokning', success: false },
        { status: 403 }
      );
    }
    
    // Check if booking can be cancelled
    if (!booking.canBeCancelled()) {
      return NextResponse.json(
        { message: 'Kan inte avboka en bokning som redan har påbörjats', success: false },
        { status: 400 }
      );
    }
    
    // Update booking status to cancelled
    booking.status = BookingStatus.CANCELLED;
    booking.uppdateradDatum = new Date();
    await booking.save();
    
    return NextResponse.json(
      { message: 'Bokningen har avbokats', success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return NextResponse.json(
      { message: 'Kunde inte avboka bokningen', success: false },
      { status: 500 }
    );
  }
}); 