import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import mongoose from 'mongoose';
import Image from '@/models/Image';

/**
 * GET /api/images/[id]
 * Serves an image stored in MongoDB by its ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    // Validate ID
    if (!mongoose.isValidObjectId(params.id)) {
      return NextResponse.json(
        { message: 'Ogiltigt bild-ID format', success: false },
        { status: 400 }
      );
    }
    
    // Find image by ID
    const image = await Image.findById(params.id);
    
    if (!image) {
      return NextResponse.json(
        { message: 'Bilden hittades inte', success: false },
        { status: 404 }
      );
    }
    
    // Create response with the image data
    const response = new NextResponse(image.data);
    
    // Set appropriate headers
    response.headers.set('Content-Type', image.contentType || 'image/jpeg');
    response.headers.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    
    return response;
  } catch (error) {
    console.error('Error fetching image:', error);
    return NextResponse.json(
      { message: 'Kunde inte hämta bilden', success: false },
      { status: 500 }
    );
  }
} 