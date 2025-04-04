import { NextResponse } from 'next/server';

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
      'X-Client-Secret': 'sk_sand_9vtahvxx.b842rghyt1jtpsqn0tkjyh44xfxm2r8zcrm2hn1p9qnkx9zc5r6b4gu1pver9x09',
      'X-Client-Id': 'e464463b-4008-4ea3-dc09-08dd6caff2f3',
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
            networkId: "bad16371-c22a-4bf4-a311-274d046cd760",
            amount: amount  // Use the total from the cart
          }
        ],
        transactionId: "1232311231231231232332", // You might want to generate this dynamically as well
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
