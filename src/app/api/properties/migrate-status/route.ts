import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Property, { PropertyStatus } from '@/models/Property';

export async function POST(request: Request) {
  try {
    await connectToDatabase();

    // Update all status variations to the correct format
    const updates = [
      // Convert uppercase to lowercase
      { from: 'ACTIVE', to: PropertyStatus.ACTIVE },
      { from: 'INACTIVE', to: PropertyStatus.INACTIVE },
      { from: 'PENDING_REVIEW', to: PropertyStatus.PENDING_REVIEW },
      { from: 'REJECTED', to: PropertyStatus.REJECTED },
      
      // Convert hyphenated to underscore
      { from: 'pending-review', to: PropertyStatus.PENDING_REVIEW },
      
      // Convert any other variations
      { from: 'PENDING-REVIEW', to: PropertyStatus.PENDING_REVIEW },
      { from: 'Pending-Review', to: PropertyStatus.PENDING_REVIEW },
      { from: 'Pending_Review', to: PropertyStatus.PENDING_REVIEW }
    ];

    let totalModified = 0;

    for (const update of updates) {
      const result = await Property.updateMany(
        { status: update.from },
        { $set: { status: update.to } }
      );
      totalModified += result.modifiedCount;
      console.log(`Updated ${result.modifiedCount} properties from ${update.from} to ${update.to}`);
    }

    // Set default status for any properties without a status
    const defaultResult = await Property.updateMany(
      { status: { $exists: false } },
      { $set: { status: PropertyStatus.PENDING_REVIEW } }
    );

    // Log current status distribution
    const statusCounts = await Property.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    console.log('Current status distribution:', statusCounts);

    return NextResponse.json({ 
      message: 'Property statuses migrated successfully',
      statusUpdates: totalModified,
      defaultsSet: defaultResult.modifiedCount,
      currentDistribution: statusCounts
    });
  } catch (error) {
    console.error('Error migrating property statuses:', error);
    return NextResponse.json(
      { message: 'Failed to migrate property statuses', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 