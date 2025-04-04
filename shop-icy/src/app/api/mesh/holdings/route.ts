// app/api/mesh/holdings/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const options = {
    method: "POST",
    headers: {
      "X-Client-Secret":
        "sk_sand_9vtahvxx.b842rghyt1jtpsqn0tkjyh44xfxm2r8zcrm2hn1p9qnkx9zc5r6b4gu1pver9x09",
      "X-Client-Id": "e464463b-4008-4ea3-dc09-08dd6caff2f3",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "coinbase",
      authToken: body.authToken,
    }),
  };

  const response = await fetch(
    "https://sandbox-integration-api.meshconnect.com/api/v1/holdings/get",
    options
  );
  const data = await response.json();

  return NextResponse.json(data);
}
