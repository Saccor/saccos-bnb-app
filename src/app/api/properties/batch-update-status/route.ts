import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import mongoose from 'mongoose';
import Property, { PropertyStatus } from '@/models/Property';
import { adminMiddleware } from '@/lib/auth';

// POST /api/properties/batch-update-status - Update multiple properties' statuses (admin only)
export const POST = adminMiddleware(async (request: NextRequest, user: any) => {
  try {
    await connectToDatabase();
    
    const { propertyIds, status, anledning } = await request.json();
    
    // Validate input
    if (!propertyIds || !Array.isArray(propertyIds) || propertyIds.length === 0) {
      return NextResponse.json(
        { message: 'propertyIds är obligatoriskt och måste vara en array med minst ett ID' },
        { status: 400 }
      );
    }
    
    // Validate status
    if (!status || !Object.values(PropertyStatus).includes(status)) {
      return NextResponse.json(
        { message: 'Ogiltig status', validStatuses: Object.values(PropertyStatus) },
        { status: 400 }
      );
    }
    
    // If rejecting, require a reason
    if (status === PropertyStatus.REJECTED && !anledning) {
      return NextResponse.json(
        { message: 'Anledning krävs för avvisade egendomar' },
        { status: 400 }
      );
    }
    
    // Validate that all IDs are valid ObjectIDs
    for (const id of propertyIds) {
      if (!mongoose.isValidObjectId(id)) {
        return NextResponse.json(
          { message: `Ogiltigt ID-format: ${id}` },
          { status: 400 }
        );
      }
    }
    
    // Prepare update data
    const updateData: any = {
      status,
      uppdateradDatum: new Date()
    };
    
    // If setting to ACTIVE, add approval info
    if (status === PropertyStatus.ACTIVE) {
      updateData.godkandDatum = new Date();
      updateData.godkandAv = user._id;
    }
    
    // If rejecting, add rejection reason
    if (status === PropertyStatus.REJECTED) {
      updateData.avvisningsAnledning = anledning;
    }
    
    // Update all specified properties
    const result = await Property.updateMany(
      { _id: { $in: propertyIds } },
      { $set: updateData }
    );
    
    return NextResponse.json({
      message: `${result.modifiedCount} egendomar uppdaterade till status ${status}`,
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount
    });
  } catch (error) {
    console.error('Error batch updating property statuses:', error);
    return NextResponse.json(
      { message: 'Kunde inte uppdatera egendomarnas status', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}); 