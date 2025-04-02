import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// --- Input Validation Schema ---
const SignInSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(1, { message: 'Password cannot be empty' }),
});

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Validate Input
    const validationResult = SignInSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      const errorMessage = Object.values(errors).flat().join(' ');
      return NextResponse.json(
        { message: errorMessage || 'Invalid input provided.' },
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    // Verify User Existence and Password
    let passwordMatch = false;
    if (user) {
      passwordMatch = await bcrypt.compare(password, user.passwordHash);
    }

    if (!user || !passwordMatch) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Authentication Successful
    const userData = {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    };

    return NextResponse.json({
      message: 'Sign in successful',
      user: userData,
    });

  } catch (error) {
    console.error('Sign in API Error:', error);
    
    return NextResponse.json(
      { message: 'An internal server error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}
