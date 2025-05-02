import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import mongoose from 'mongoose';
import Property, { PropertyStatus } from '@/models/Property';
import { listingAgentMiddleware } from '@/lib/auth';

// POST /api/properties/[id]/reject - Reject a property
export const POST = listingAgentMiddleware(async (
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
    
    // Get the property
    const property = await Property.findById(params.id);
    
    if (!property) {
      return NextResponse.json(
        { message: 'Egendomen hittades inte' },
        { status: 404 }
      );
    }
    
    // Check if property is pending review
    if (property.status !== PropertyStatus.PENDING_REVIEW) {
      return NextResponse.json(
        { message: 'Egendomen är inte i väntande status' },
        { status: 400 }
      );
    }
    
    // Get rejection reason from request body
    const { anledning } = await request.json();
    
    if (!anledning) {
      return NextResponse.json(
        { message: 'Anledning för avvisning krävs' },
        { status: 400 }
      );
    }
    
    // Reject the property
    property.status = PropertyStatus.REJECTED;
    property.avvisningsAnledning = anledning;
    property.uppdateradDatum = new Date();
    
    await property.save();
    
    return NextResponse.json({
      message: 'Egendomen avvisad',
      property
    });
  } catch (error) {
    console.error('Error rejecting property:', error);
    return NextResponse.json(
      { message: 'Kunde inte avvisa egendomen' },
      { status: 500 }
    );
  }
}); 