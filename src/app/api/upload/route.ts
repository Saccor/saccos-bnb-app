import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { authMiddleware } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// Helper to ensure upload directory exists
async function ensureUploadDir(dirPath: string) {
  try {
    await mkdir(dirPath, { recursive: true });
  } catch (error) {
    console.error('Error creating upload directory:', error);
  }
}

/**
 * POST /api/upload
 * Handles image uploads for properties
 */
export const POST = authMiddleware(async (request: NextRequest) => {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { message: 'Inga filer hittades' },
        { status: 400 }
      );
    }
    
    // Define upload directory
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    await ensureUploadDir(uploadDir);
    
    const savedFiles = await Promise.all(
      files.map(async (file) => {
        // Generate a unique filename with original extension
        const originalExt = file.name.split('.').pop() || 'jpg';
        const filename = `${uuidv4()}.${originalExt}`;
        const filePath = join(uploadDir, filename);
        
        // Convert file to Buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Write file to disk
        await writeFile(filePath, buffer);
        
        // Return the public URL
        return `/uploads/${filename}`;
      })
    );
    
    return NextResponse.json({ 
      message: 'Filer uppladdade', 
      urls: savedFiles 
    });
  } catch (error) {
    console.error('Error handling file upload:', error);
    return NextResponse.json(
      { message: 'Kunde inte ladda upp filer', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}); 