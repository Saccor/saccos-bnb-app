import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import Booking from '@/models/Booking';

// DELETE /api/bookings/:id - Cancel a booking
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;
    
    if (!bookingId) {
      return NextResponse.json(
        { message: 'Boknings-ID krävs' },
        { status: 400 }
      );
    }
    
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
    
    // Find booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.json(
        { message: 'Bokningen hittades inte' },
        { status: 404 }
      );
    }
    
    // Check if user is authorized to cancel the booking
    if (booking.user.toString() !== userData.userId && !userData.isAdmin) {
      return NextResponse.json(
        { message: 'Du har inte behörighet att avboka denna bokning' },
        { status: 403 }
      );
    }
    
    // Check if check-in date is in the past
    const now = new Date();
    if (new Date(booking.incheckningDatum) < now) {
      return NextResponse.json(
        { message: 'Kan inte avboka en bokning som redan har påbörjats' },
        { status: 400 }
      );
    }
    
    // Delete booking
    await Booking.findByIdAndDelete(bookingId);
    
    return NextResponse.json({ message: 'Bokning avbokad' });
  } catch (error) {
    console.error('Error canceling booking:', error);
    return NextResponse.json(
      { message: 'Kunde inte avboka bokning' },
      { status: 500 }
    );
  }
} 