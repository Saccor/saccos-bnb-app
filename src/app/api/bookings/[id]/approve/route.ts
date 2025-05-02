import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import mongoose from 'mongoose';
import { authMiddleware, roleMiddleware } from '@/lib/auth';
import { UserRole } from '@/models/User';
import Booking, { BookingStatus } from '@/models/Booking';
import Property from '@/models/Property';

// POST /api/bookings/[id]/approve - Approve a booking
export const POST = authMiddleware(async (request: NextRequest, user: any, { params }: { params: { id: string } }) => {
  try {
    await connectToDatabase();
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { message: 'Ogiltigt boknings-ID format' },
        { status: 400 }
      );
    }
    
    // Find the booking
    const booking = await Booking.findById(params.id);
    
    if (!booking) {
      return NextResponse.json(
        { message: 'Bokningen hittades inte' },
        { status: 404 }
      );
    }
    
    // Get the property to check ownership
    const property = await Property.findById(booking.egendom);
    
    if (!property) {
      return NextResponse.json(
        { message: 'Egendomen hittades inte' },
        { status: 404 }
      );
    }
    
    // Check if user has permission to approve this booking
    if (user.roll !== UserRole.ADMIN && property.agare.toString() !== user._id) {
      return NextResponse.json(
        { message: 'Du har inte behörighet att godkänna denna bokning' },
        { status: 403 }
      );
    }
    
    // Check if booking is in pending status
    if (booking.status !== BookingStatus.PENDING) {
      return NextResponse.json(
        { message: 'Kan endast godkänna bokningar med status "väntande"' },
        { status: 400 }
      );
    }
    
    // Update booking status to accepted
    booking.status = BookingStatus.ACCEPTED;
    booking.godkandDatum = new Date();
    booking.godkandAv = user._id;
    booking.uppdateradDatum = new Date();
    await booking.save();
    
    return NextResponse.json(booking);
  } catch (error) {
    console.error('Error approving booking:', error);
    return NextResponse.json(
      { message: 'Kunde inte godkänna bokningen' },
      { status: 500 }
    );
  }
}); 