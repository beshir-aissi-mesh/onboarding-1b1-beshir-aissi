// app/api/cart/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    // In a real app, you would get the user ID from the session
    // For this example, we'll use a placeholder user ID
    const userId = "placeholder-user-id";
    
    const { productId, quantity } = await request.json();
    
    if (!productId || !quantity || quantity < 1) {
      return NextResponse.json(
        { error: 'Invalid product or quantity' },
        { status: 400 }
      );
    }
    
    // Check if product exists and has enough stock
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    if (product.stock < quantity) {
      return NextResponse.json(
        { error: 'Not enough stock available' },
        { status: 400 }
      );
    }
    
    // In a real app, this would create or update a cart item
    // For this example, we'll just return success
    
    return NextResponse.json({ 
      success: true,
      message: 'Product added to cart successfully'
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json(
      { error: 'Failed to add product to cart' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
