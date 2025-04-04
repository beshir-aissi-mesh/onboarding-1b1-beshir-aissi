// src/app/api/checkout/[orderId]/linktoken/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

const MESH_API_SECRET = process.env.MESH_API_SECRET;
const MESH_CLIENT_ID = process.env.MESH_CLIENT_ID;
const YOUR_RECEIVING_WALLET_ADDRESS = process.env.RECEIVING_WALLET_ADDRESS;
const PAYMENT_NETWORK_ID = process.env.PAYMENT_NETWORK_ID;
const PAYMENT_SYMBOL = process.env.PAYMENT_SYMBOL || "USDC";

export async function POST(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  if (!MESH_API_SECRET || !MESH_CLIENT_ID || !YOUR_RECEIVING_WALLET_ADDRESS || !PAYMENT_NETWORK_ID) {
    console.error("Mesh environment variables not set");
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  try {
    const orderId = params.orderId;
    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) =>
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            ),
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    const userId = user.id;

    // Fetch the order to get the total amount and verify ownership
    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
        userId: userId, // Ensure the order belongs to the logged-in user
        status: "PENDING_PAYMENT", // Ensure it's ready for payment
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found or not valid for payment" }, { status: 404 });
    }

    // Prepare Mesh API request body
    const meshPayload = {
      brokerType: "coinbase", // Or make this dynamic if needed
      // Use the Supabase user ID or another stable identifier you manage
      userId: `app_user_${userId}`,
      transferOptions: {
        toAddresses: [
          {
            address: YOUR_RECEIVING_WALLET_ADDRESS,
            symbol: PAYMENT_SYMBOL,
            networkId: PAYMENT_NETWORK_ID,
            // Convert Prisma Decimal to number for the API call
            amount: Number(order.total),
          },
        ],
        // Use the database order ID as the transactionId for easier reconciliation
        transactionId: order.id,
        clientFee: 0, // Fee
        transferType: "payment",
      },
      restrictMultipleAccounts: true, // Recommended for payments
    };

    // Call Mesh API to get the link token
    const meshResponse = await fetch('https://sandbox-integration-api.meshconnect.com/api/v1/linktoken', {
      method: 'POST',
      headers: {
        'X-Client-Secret': MESH_API_SECRET,
        'X-Client-Id': MESH_CLIENT_ID,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(meshPayload),
    });

    const meshData = await meshResponse.json();

    if (!meshResponse.ok || !meshData.content?.linkToken) {
      console.error("Mesh API Error:", meshData);
      throw new Error(meshData.message || "Failed to generate Mesh link token");
    }

    // Return only the linkToken to the frontend
    return NextResponse.json({ linkToken: meshData.content.linkToken }, { status: 200 });

  } catch (error: any) {
    console.error("Error generating link token:", error);
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 });
  }
}