// app/api/auth/verify-user/route.ts
import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';

export async function POST(request: Request) {
  try {
    const { userId, email } = await request.json();

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'User ID and email are required' },
        { status: 400 }
      );
    }

    // Check if user exists in the database by ID
    let user = await prisma.user.findUnique({
      where: { id: userId },
    });

    // If not found by ID, try email
    if (!user) {
      user = await prisma.user.findUnique({
        where: { email },
      });
    }

    // If user doesn't exist, return an error
    if (!user) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    // User exists in the database
    return NextResponse.json({
      data: { exists: true, userId: user.id },
      error: null,
    });
  } catch (error) {
    console.error('User verification error:', error);
    return NextResponse.json(
      { data: null, error: 'Failed to verify user' },
      { status: 500 }
    );
  }
}
