import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Property, { PropertyStatus } from '@/models/Property';

export async function POST(request: Request) {
  try {
    console.log('Starting property migration...');
    await connectToDatabase();

    // First, update all properties with pending_review status
    const pendingResult = await Property.updateMany(
      { status: PropertyStatus.PENDING_REVIEW },
      { $set: { status: PropertyStatus.ACTIVE } }
    );
    console.log('Updated pending_review properties:', pendingResult.modifiedCount);

    // Then, update all properties without a status
    const noStatusResult = await Property.updateMany(
      { status: { $exists: false } },
      { $set: { status: PropertyStatus.ACTIVE } }
    );
    console.log('Updated properties without status:', noStatusResult.modifiedCount);

    // Update properties with lowercase status values
    const lowercaseResult = await Property.updateMany(
      { status: { $in: ['active', 'inactive', 'rejected'] } },
      [
        {
          $set: {
            status: {
              $switch: {
                branches: [
                  { case: { $eq: ['$status', 'active'] }, then: PropertyStatus.ACTIVE },
                  { case: { $eq: ['$status', 'inactive'] }, then: PropertyStatus.INACTIVE },
                  { case: { $eq: ['$status', 'rejected'] }, then: PropertyStatus.REJECTED }
                ],
                default: '$status'
              }
            }
          }
        }
      ]
    );
    console.log('Updated lowercase status properties:', lowercaseResult.modifiedCount);

    // Finally, update any other missing fields
    const properties = await Property.find({});
    console.log('Found total properties:', properties.length);

    let updatedCount = 0;

    // Update each property
    for (const property of properties) {
      const updates: any = {};

      if (property.tillganglighet === undefined) {
        updates.tillganglighet = true;
      }
      if (!property.skapadDatum) {
        updates.skapadDatum = new Date();
      }
      if (!property.uppdateradDatum) {
        updates.uppdateradDatum = new Date();
      }
      if (!property.bilder) {
        updates.bilder = [];
      }

      // Only update if there are changes to make
      if (Object.keys(updates).length > 0) {
        console.log(`Updating property ${property._id} with:`, updates);
        await Property.findByIdAndUpdate(property._id, { $set: updates });
        updatedCount++;
      }
    }

    // Verify all properties are now active
    const activeProperties = await Property.find({ status: PropertyStatus.ACTIVE });
    console.log('Total active properties after migration:', activeProperties.length);

    // Log all properties and their statuses for verification
    const allProperties = await Property.find({}, 'namn status');
    console.log('All properties with their statuses:', allProperties);

    return NextResponse.json({
      message: 'Properties migration completed',
      pendingUpdated: pendingResult.modifiedCount,
      noStatusUpdated: noStatusResult.modifiedCount,
      lowercaseUpdated: lowercaseResult.modifiedCount,
      otherUpdates: updatedCount,
      totalActiveProperties: activeProperties.length,
      allProperties: allProperties
    });
  } catch (error) {
    console.error('Error during migration:', error);
    return NextResponse.json(
      { message: 'Migration failed', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 