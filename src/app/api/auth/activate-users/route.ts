import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';

export async function POST(request: Request) {
  try {
    // Connect to database
    await connectToDatabase();

    // Update all users to be active
    const result = await User.updateMany({}, { $set: { aktiv: true } });

    return NextResponse.json({ 
      message: 'All users activated successfully',
      modifiedCount: result.modifiedCount 
    });
  } catch (error) {
    console.error('Error activating users:', error);
    return NextResponse.json(
      { message: 'Failed to activate users', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 