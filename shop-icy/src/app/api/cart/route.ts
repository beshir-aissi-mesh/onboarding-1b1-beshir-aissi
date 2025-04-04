import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
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

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: "Authentication required", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }
    const userId = user.id;

    const prismaUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!prismaUser) {
      return NextResponse.json(
        { error: "Profile not complete", code: "PROFILE_INCOMPLETE" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { productId, quantity } = body; // quantity is now the desired new quantity
    if (!productId || quantity === undefined || typeof quantity !== "number") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    if (quantity > product.stock) {
      return NextResponse.json(
        { error: "Quantity exceeds available stock" },
        { status: 400 }
      );
    }

    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } });
    }

    const existingItem = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });

    if (existingItem) {
      if (quantity < 1) {
        await prisma.cartItem.delete({ where: { id: existingItem.id } });
        return NextResponse.json({ message: "Item removed from cart" }, { status: 200 });
      }
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity },
      });
    } else {
      if (quantity < 1) {
        return NextResponse.json(
          { error: "Cannot set quantity less than 1 for a non-existent item" },
          { status: 400 }
        );
      }
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
        },
      });
    }

    return NextResponse.json({ message: "Cart updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error in /api/cart:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
