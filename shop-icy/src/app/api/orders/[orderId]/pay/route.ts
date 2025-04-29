import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: Request,
  context: { params: { orderId: string } }
) {
  try {
    // Use Next.js cookies API to get a cookie store - with await
    const cookieStore = await cookies();

    // Create a Supabase server client with the resolved cookie store
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch (error) {
              console.error("Error setting cookies:", error);
            }
          },
        },
      }
    );

    // Securely get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Authentication required", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Check if user exists in Prisma database
    const prismaUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!prismaUser) {
      return NextResponse.json(
        { error: "Profile not complete", code: "PROFILE_INCOMPLETE" },
        { status: 403 }
      );
    }

    const orderItems = await prisma.orderItem.findMany({
      where: {
        orderId: context.params.orderId,
      },
    });

    // Update product stock
    for (const item of orderItems) {
      await prisma.product.update(
        {
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        },
      );
    }

    // Update order status to PAID
    // console.log(`Updating order ${context.params.orderId} to PAID.`);
    const updatedOrder = await prisma.order.update({
      where: { id: context.params.orderId },
      data: { status: "PAID" },
    });

    // Return a successful JSON response with the updated order details
    return NextResponse.json({ order: updatedOrder });

  } catch (error) {
    console.error("Error processing payment:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
