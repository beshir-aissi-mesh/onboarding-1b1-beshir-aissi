// src/app/api/cart/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET method to fetch cart items
export async function GET(req: NextRequest) {
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

    // Get user's cart with items
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart) {
      // If no cart found, create one
      const newCart = await prisma.cart.create({
        data: { userId },
      });
      return NextResponse.json({ items: [] }, { status: 200 });
    }

    return NextResponse.json({ items: cart.items }, { status: 200 });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// POST method to process checkout
export async function POST(req: NextRequest) {
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

    // Get user's cart with items
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Validate stock for all items
    for (const item of cart.items) {
      if (item.quantity > item.product.stock) {
        return NextResponse.json(
          {
            error: `Not enough stock for "${item.product.name}"`,
            product: item.product,
          },
          { status: 400 }
        );
      }
    }

    // Calculate order total
    const orderTotal = cart.items.reduce((total, item) => {
      const price = parseFloat(item.product.price.toString());
      return total + price * item.quantity;
    }, 0);

    // Create the order in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create main order
      const newOrder = await tx.order.create({
        data: {
          userId,
          total: orderTotal,
          status: "PENDING_PAYMENT",
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // Update product stock
      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: item.product.stock - item.quantity },
        });
      }

      return newOrder;
    });

    // Don't clear the cart yet - typically done after payment confirmation

    return NextResponse.json(
      {
        message: "Checkout successful",
        order: {
          id: order.id,
          total: order.total,
          status: order.status,
          items: order.items,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// DELETE method to clear cart after successful checkout
export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies();
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

    // Get the authenticated user
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

    // Read query parameters
    const url = new URL(req.url);
    const itemId = url.searchParams.get("itemId");
    const orderId = url.searchParams.get("orderId");

    if (itemId) {
      // Remove a single cart item
      const cart = await prisma.cart.findUnique({ where: { userId } });
      if (!cart) {
        return NextResponse.json({ error: "Cart not found" }, { status: 404 });
      }
      const cartItem = await prisma.cartItem.findUnique({
        where: { id: itemId },
      });
      if (!cartItem || cartItem.cartId !== cart.id) {
        return NextResponse.json(
          { error: "Cart item not found" },
          { status: 404 }
        );
      }
      await prisma.cartItem.delete({ where: { id: itemId } });
      return NextResponse.json(
        { message: "Item removed successfully" },
        { status: 200 }
      );
    } else if (orderId) {
      // Clear entire cart after checkout if an orderId is provided
      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          userId,
          // status: { in: ["PAID", "SHIPPED"] }, // Only allow clearing cart if order is processed
        },
      });
      if (!order) {
        return NextResponse.json(
          { error: "Order not found or not eligible for cart clearing" },
          { status: 404 }
        );
      }
      const cart = await prisma.cart.findUnique({ where: { userId } });
      if (cart) {
        await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
      }
      return NextResponse.json(
        { message: "Cart cleared successfully" },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: "Either itemId or orderId is required" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error in DELETE /api/cart/checkout:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
