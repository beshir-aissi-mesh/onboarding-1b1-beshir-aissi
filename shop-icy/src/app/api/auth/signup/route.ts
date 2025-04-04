import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Prisma } from "@prisma/client";

// Updated schema to accept an ID from Supabase - this should be required
// for Supabase synchronization cases
const SignupSchema = z.object({
  id: z.string().optional(), // Supabase user ID
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" }),
  fromSupabase: z.boolean().optional().default(false), // Flag to indicate if this signup is syncing from Supabase
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

    const { id, email, password, fromSupabase } = validationResult.data;

    // If this request is syncing a Supabase user, we should make sure
    // the ID is provided
    if (fromSupabase && !id) {
      return NextResponse.json(
        { message: "Supabase user ID is required for synchronization" },
        { status: 400 }
      );
    }

    // Special handling for Supabase user syncing
    if (fromSupabase) {
      // Check if user already exists by ID
      const existingUserById = await prisma.user.findUnique({
        where: { id },
      });

      // If user already exists by this ID, return success
      if (existingUserById) {
        return NextResponse.json(
          {
            message: "User already synchronized",
            user: {
              id: existingUserById.id,
              email: existingUserById.email,
              createdAt: existingUserById.createdAt,
            },
          },
          { status: 200 }
        );
      }
    } else {
      // For regular signups, check by email
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return NextResponse.json(
          { message: "Email address is already registered" },
          { status: 409 }
        );
      }
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create User with the provided ID or generate a new one
    const newUser = await prisma.$transaction(async (tx) => {
      // When syncing from Supabase, make sure to use the provided ID
      const userData: any = {
        email: email,
        passwordHash: passwordHash,
      };

      // Add ID to the data object if it was provided
      if (id) {
        userData.id = id;
      }

      const createdUser = await tx.user.create({
        data: userData,
      });

      await tx.consentLog.create({
        data: {
          userId: createdUser.id,
          consentType: LATEST_CONSENT_TYPE,
          givenAt: new Date(),
        },
      });

      // Create an empty cart for the user
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
    console.error("Signup API Error:", error);

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
