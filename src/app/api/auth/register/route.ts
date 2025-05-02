import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User, { UserRole } from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { namn, epost, losenord } = await request.json();

    // Validate input
    if (!namn || !epost || !losenord) {
      return NextResponse.json(
        { message: 'Alla fält är obligatoriska' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(epost)) {
      return NextResponse.json(
        { message: 'Ogiltig e-postadress' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (losenord.length < 6) {
      return NextResponse.json(
        { message: 'Lösenordet måste vara minst 6 tecken' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if user already exists
    const existingUser = await User.findOne({ epost });
    if (existingUser) {
      return NextResponse.json(
        { message: 'E-postadressen är redan registrerad' },
        { status: 400 }
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(losenord, salt);

    // Create new user
    const user = await User.create({
      namn,
      epost,
      losenord: hashedPassword,
      roll: UserRole.USER, // Default role
      aktiv: true,
      skapadDatum: new Date()
    });

    return NextResponse.json({
      message: 'Användare skapad',
      user: {
        _id: user._id,
        namn: user.namn,
        epost: user.epost,
        roll: user.roll
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid registrering' },
      { status: 500 }
    );
  }
} 