import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { namn, epost, losenord } = await request.json();

    // Validate input
    if (!namn || !epost || !losenord) {
      return NextResponse.json(
        { message: 'Alla fält måste fyllas i' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(epost)) {
      return NextResponse.json(
        { message: 'Ogiltig e-postadress' },
        { status: 400 }
      );
    }

    // Validate password length
    if (losenord.length < 6) {
      return NextResponse.json(
        { message: 'Lösenordet måste vara minst 6 tecken' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Check if user already exists
    const existingUser = await User.findOne({ epost });
    if (existingUser) {
      return NextResponse.json(
        { message: 'En användare med denna e-post finns redan' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(losenord, 10);

    // Create new user
    const user = await User.create({
      namn,
      epost,
      losenord: hashedPassword,
      isAdmin: false
    });

    // Return user without password
    const userResponse = {
      id: user._id,
      namn: user.namn,
      epost: user.epost,
      isAdmin: user.isAdmin,
      skapadDatum: user.skapadDatum
    };

    return NextResponse.json(
      { message: 'Användare skapad', user: userResponse },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid registrering' },
      { status: 500 }
    );
  }
} 