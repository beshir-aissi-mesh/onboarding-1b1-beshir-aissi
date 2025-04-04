import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const SignupSchema = z.object({
  id: z.string(), // Supabase user ID is required
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" }),
});

const LATEST_CONSENT_TYPE = "TermsOfServiceAndPrivacyPolicy_v1.0";
const SALT_ROUNDS = 10;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = SignupSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          message: "Invalid input",
          errors: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { id, email, password } = validationResult.data;

    // Check if user already exists by Supabase ID
    const existingUser = await prisma.user.findUnique({ where: { id } });

    if (existingUser) {
      return NextResponse.json(
        {
          message: "User already synchronized",
          user: {
            id: existingUser.id,
            email: existingUser.email,
            createdAt: existingUser.createdAt,
          },
        },
        { status: 200 }
      );
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          id,
          email,
          passwordHash,
        },
      });

      await tx.consentLog.create({
        data: {
          userId: createdUser.id,
          consentType: LATEST_CONSENT_TYPE,
          givenAt: new Date(),
        },
      });

      await tx.cart.create({
        data: {
          userId: createdUser.id,
        },
      });

      return createdUser;
    });

    return NextResponse.json(
      {
        message: "User registered successfully",
        user: {
          id: newUser.id,
          email: newUser.email,
          createdAt: newUser.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Supabase Sync Error:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { message: "Email address is already registered" },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
