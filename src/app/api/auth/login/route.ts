import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User, { UserRole } from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
  try {
    const { epost, losenord } = await request.json();
    console.log('Login attempt for email:', epost);

    // Validate input
    if (!epost || !losenord) {
      return NextResponse.json(
        { message: 'E-post och lösenord krävs' },
        { status: 400 }
      );
    }

    // Connect to database
    try {
      await connectToDatabase();
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        { message: 'Kunde inte ansluta till databasen', error: dbError instanceof Error ? dbError.message : String(dbError) },
        { status: 500 }
      );
    }

    // Find user
    let user;
    try {
      user = await User.findOne({ epost });
      console.log('User found:', user ? 'Yes' : 'No');
    } catch (findError) {
      console.error('User find error:', findError);
      return NextResponse.json(
        { message: 'Fel vid sökning efter användare', error: findError instanceof Error ? findError.message : String(findError) },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { message: 'Ogiltiga inloggningsuppgifter' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.aktiv) {
      return NextResponse.json(
        { message: 'Kontot är inaktiverat' },
        { status: 403 }
      );
    }

    // Verify password
    let isValidPassword;
    try {
      isValidPassword = await bcrypt.compare(losenord, user.losenord);
      console.log('Password valid:', isValidPassword);
    } catch (passwordError) {
      console.error('Password comparison error:', passwordError);
      return NextResponse.json(
        { message: 'Fel vid lösenordsverifiering', error: passwordError instanceof Error ? passwordError.message : String(passwordError) },
        { status: 500 }
      );
    }

    if (!isValidPassword) {
      return NextResponse.json(
        { message: 'Ogiltiga inloggningsuppgifter' },
        { status: 401 }
      );
    }

    // Generate JWT token
    let token;
    try {
      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined in environment variables');
      }
      
      console.log('Generating token for user ID:', user._id);
      console.log('User object:', {
        _id: user._id.toString(),
        epost: user.epost,
        roll: user.roll
      });
      
      token = jwt.sign(
        { 
          userId: user._id,
          roll: user.roll
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      console.log('Token generated successfully:', token.substring(0, 20) + '...');
    } catch (tokenError) {
      console.error('Token generation error:', tokenError);
      return NextResponse.json(
        { message: 'Fel vid generering av token', error: tokenError instanceof Error ? tokenError.message : String(tokenError) },
        { status: 500 }
      );
    }

    // Update last login
    user.senastInloggning = new Date();
    await user.save();

    return NextResponse.json({ 
      token,
      user: {
        _id: user._id,
        namn: user.namn,
        epost: user.epost,
        roll: user.roll
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid inloggning', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 