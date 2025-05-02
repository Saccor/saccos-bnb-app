import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import mongoose from 'mongoose';
import Property, { PropertyStatus } from '@/models/Property';
import { adminMiddleware } from '@/lib/auth';

// POST /api/properties/[id]/update-status - Update property status (admin only)
export const POST = adminMiddleware(async (
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
    
    // Get status from request body
    const { status } = await request.json();
    
    // Validate the status
    if (!status || !Object.values(PropertyStatus).includes(status as PropertyStatus)) {
      return NextResponse.json(
        { message: 'Ogiltig status', validStatuses: Object.values(PropertyStatus) },
        { status: 400 }
      );
    }
    
    // Update the property status
    property.status = status as PropertyStatus;
    property.uppdateradDatum = new Date();
    
    // If setting to ACTIVE from PENDING_REVIEW, set approval info
    if (status === PropertyStatus.ACTIVE && property.status === PropertyStatus.PENDING_REVIEW) {
      property.godkandDatum = new Date();
      property.godkandAv = user._id;
    }
    
    // If setting to REJECTED, ensure we have a reason
    if (status === PropertyStatus.REJECTED) {
      const { anledning } = await request.json();
      if (!anledning) {
        return NextResponse.json(
          { message: 'Anledning krävs för avvisade egendomar' },
          { status: 400 }
        );
      }
      property.avvisningsAnledning = anledning;
    }
    
    await property.save();
    
    return NextResponse.json({
      message: `Egendomens status uppdaterad till ${status}`,
      property
    });
  } catch (error) {
    console.error('Error updating property status:', error);
    return NextResponse.json(
      { message: 'Kunde inte uppdatera egendomens status' },
      { status: 500 }
    );
  }
}); 