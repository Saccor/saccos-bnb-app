import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Property, { PropertyStatus } from '@/models/Property';

export async function POST(request: Request) {
  try {
    console.log('Activating all properties...');
    // Connect to database
    await connectToDatabase();

    // Update all non-active properties to be active
    const result = await Property.updateMany(
      { 
        status: { 
          $ne: PropertyStatus.ACTIVE 
        }
      },
      { 
        $set: { 
          status: PropertyStatus.ACTIVE,
          uppdateradDatum: new Date()
        } 
      }
    );

    console.log('Activation result:', result);

    return NextResponse.json({ 
      message: 'All properties activated successfully',
      modifiedCount: result.modifiedCount 
    });
  } catch (error) {
    console.error('Error activating properties:', error);
    return NextResponse.json(
      { message: 'Failed to activate properties', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 