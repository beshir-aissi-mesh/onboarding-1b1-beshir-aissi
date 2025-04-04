import { NextResponse } from 'next/server';

const MESH_API_SECRET = process.env.MESH_API_SECRET;
const MESH_CLIENT_ID = process.env.MESH_CLIENT_ID;

export async function POST(request: Request) {
  // Parse the request body to extract the total amount from the cart
  const { total } = await request.json();

  // Validate that total is provided and is a valid number
  if (!total || isNaN(Number(total))) {
    return NextResponse.json({ error: "Invalid or missing total amount" }, { status: 400 });
  }

  const amount = Number(total);

  const options = {
    method: 'POST',
    headers: {
      'X-Client-Secret': MESH_API_SECRET??'',
      'X-Client-Id': MESH_CLIENT_ID??'',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      brokerType: "coinbase",
      userId: "beshiraissi",
      transferOptions: {
        toAddresses: [
          {
            address: "0x0Ff0000f0A0f0000F0F000000000ffFf00f0F0f0",
            symbol: "USDC",
            networkId: "e3c7fdd8-b1fc-4e51-85ae-bb276e075611",
            amount: amount  // Use the total from the cart
          }
        ],
        transactionId: "1232311231231231232332", // Make Dynamic
        clientFee: 0,
        transferType: "payment"
      },
      restrictMultipleAccounts: true,
      integrationId: "47624467-e52e-4938-a41a-7926b6c27acf"
    })
  };

  const response = await fetch('https://sandbox-integration-api.meshconnect.com/api/v1/linktoken', options);
  const data = await response.json();

  return NextResponse.json(data);
}
