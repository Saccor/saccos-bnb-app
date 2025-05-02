import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import connectToDatabase from '@/lib/db';
import Image from '@/models/Image';

/**
 * POST /api/upload
 * Handles image uploads for properties and stores them in MongoDB
 */
export const POST = authMiddleware(async (request: NextRequest, user: any) => {
  try {
    await connectToDatabase();
    
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { message: 'Inga filer hittades', success: false },
        { status: 400 }
      );
    }
    
    const savedFiles = await Promise.all(
      files.map(async (file) => {
        // Generate a unique filename with original extension
        const originalExt = file.name.split('.').pop() || 'jpg';
        const filename = `${uuidv4()}.${originalExt}`;
        
        // Convert file to Buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Save to MongoDB
        const image = new Image({
          filename,
          contentType: file.type,
          data: buffer,
          uploadedBy: user._id
        });
        
        await image.save();
        
        // Return the URL to access this image via our API
        return `/api/images/${image._id}`;
      })
    );
    
    return NextResponse.json({ 
      message: 'Filer uppladdade', 
      urls: savedFiles,
      success: true
    });
  } catch (error) {
    console.error('Error handling file upload:', error);
    return NextResponse.json(
      { 
        message: 'Kunde inte ladda upp filer', 
        error: error instanceof Error ? error.message : String(error),
        success: false 
      },
      { status: 500 }
    );
  }
}); 