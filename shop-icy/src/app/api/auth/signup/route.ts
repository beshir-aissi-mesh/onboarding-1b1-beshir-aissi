// src/app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { Prisma } from '@prisma/client'; // Import Prisma namespace for error types

// --- Input Validation Schema ---
const SignupSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long' }),
  // Optionally, you could require explicit consent confirmation in the request body
  // consentGiven: z.literal(true, { errorMap: () => ({ message: 'You must agree to the terms' }) })
});

// --- GDPR Consent Type ---
// Define this clearly, perhaps matching a version of your terms/policy
const LATEST_CONSENT_TYPE = 'TermsOfServiceAndPrivacyPolicy_v1.0';

// --- Password Hashing ---
const SALT_ROUNDS = 10; // Standard practice for bcrypt salt rounds

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Validate Input
    const validationResult = SignupSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          message: 'Invalid input',
          errors: validationResult.error.flatten().fieldErrors,
        }, 
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'Email address is already registered' }, 
        { status: 409 }
      );
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create User and ConsentLog in a Transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: email,
          passwordHash: passwordHash,
        },
      });

      // Log consent immediately upon user creation
      await tx.consentLog.create({
        data: {
          userId: createdUser.id,
          consentType: LATEST_CONSENT_TYPE,
          givenAt: new Date(),
        },
      });

      return createdUser;
    });

    // Return Success Response
    return NextResponse.json(
      {
        message: 'User registered successfully',
        user: {
          id: newUser.id,
          email: newUser.email,
          createdAt: newUser.createdAt,
        },
      }, 
      { status: 201 }
    );

  } catch (error: unknown) {
    console.error('Signup API Error:', error);

    // Handle potential Prisma unique constraint errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { message: 'Email address is already registered' }, 
          { status: 409 }
        );
      }
    }

    // Generic server error
    return NextResponse.json(
      { message: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}
