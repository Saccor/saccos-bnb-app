import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import mongoose from 'mongoose';

export async function GET() {
  try {
    // Test database connection
    await connectToDatabase();
    
    // Check if we're connected
    const isConnected = mongoose.connection.readyState === 1;
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: {
        connected: isConnected,
        name: mongoose.connection.name,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
      },
      environment: {
        node: process.version,
        mongodb_uri_set: !!process.env.MONGODB_URI,
        jwt_secret_set: !!process.env.JWT_SECRET,
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Health check failed',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 