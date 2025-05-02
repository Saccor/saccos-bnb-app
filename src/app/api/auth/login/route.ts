import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User, { UserRole, IUser } from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

export async function POST(request: Request) {
  try {
    const { epost, losenord } = await request.json();
    console.log('Login attempt for email:', epost);

    // Validate input
    if (!epost || !losenord) {
      return NextResponse.json(
        { message: 'E-post och lösenord krävs', success: false },
        { status: 400 }
      );
    }

    // Connect to database
    try {
      await connectToDatabase();
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        { message: 'Kunde inte ansluta till databasen', error: dbError instanceof Error ? dbError.message : String(dbError), success: false },
        { status: 500 }
      );
    }

    // Find user
    let user: IUser | null;
    try {
      user = await User.findOne({ epost });
      console.log('User found:', user ? 'Yes' : 'No');
    } catch (findError) {
      console.error('User find error:', findError);
      return NextResponse.json(
        { message: 'Fel vid sökning efter användare', error: findError instanceof Error ? findError.message : String(findError), success: false },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { message: 'Ogiltiga inloggningsuppgifter', success: false },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.aktiv) {
      return NextResponse.json(
        { message: 'Kontot är inaktiverat', success: false },
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
        { message: 'Fel vid lösenordsverifiering', error: passwordError instanceof Error ? passwordError.message : String(passwordError), success: false },
        { status: 500 }
      );
    }

    if (!isValidPassword) {
      return NextResponse.json(
        { message: 'Ogiltiga inloggningsuppgifter', success: false },
        { status: 401 }
      );
    }

    // Get user ID as string with more robust type handling
    const userId = user._id 
      ? user._id instanceof Types.ObjectId 
        ? user._id.toString()
        : String(user._id)
      : '';

    if (!userId) {
      throw new Error('Invalid user ID');
    }

    // Generate JWT token
    let token;
    try {
      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined in environment variables');
      }
      
      console.log('Generating token for user ID:', userId);
      console.log('User object:', {
        _id: userId,
        epost: user.epost,
        roll: user.roll
      });
      
      token = jwt.sign(
        { 
          userId: userId,
          roll: user.roll
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      console.log('Token generated successfully:', token.substring(0, 20) + '...');
    } catch (tokenError) {
      console.error('Token generation error:', tokenError);
      return NextResponse.json(
        { message: 'Fel vid generering av token', error: tokenError instanceof Error ? tokenError.message : String(tokenError), success: false },
        { status: 500 }
      );
    }

    // Update last login
    user.senastInloggning = new Date();
    await user.save();

    // Create a plain JavaScript object from the mongoose document
    const userObj = user.toObject();

    return NextResponse.json({ 
      token,
      user: {
        _id: userId,
        namn: userObj.namn,
        epost: userObj.epost,
        roll: userObj.roll
      },
      success: true
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid inloggning', error: error instanceof Error ? error.message : String(error), success: false },
      { status: 500 }
    );
  }
} 