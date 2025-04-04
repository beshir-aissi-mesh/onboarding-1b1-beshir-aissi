import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  context: { params: { orderId: string } }
) {
  // Await the params to satisfy Next.js requirements.
  const { orderId } = await Promise.resolve(context.params);
  console.log(`Updating order ${orderId} to PAID.`);

  // Simulate a database update (replace with your actual update logic)
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Return a successful JSON response with the updated order details
  return NextResponse.json({ order: { id: orderId, status: "PAID" } });
}
