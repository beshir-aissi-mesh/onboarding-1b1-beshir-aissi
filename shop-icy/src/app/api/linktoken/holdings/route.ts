import { NextResponse } from "next/server";

const MESH_API_SECRET = process.env.MESH_API_SECRET;
const MESH_CLIENT_ID = process.env.MESH_CLIENT_ID;

export async function POST() {
  const options = {
    method: "POST",
    headers: {
      "X-Client-Secret": MESH_API_SECRET?? "",
      "X-Client-Id": MESH_CLIENT_ID?? "",
      "Content-Type": "application/json",
    },
    body: '{"userId":"beshirais","verifyWalletOptions":{"networkId":"e3c7fdd8-b1fc-4e51-85ae-bb276e075611"},"integrationId":"47624467-e52e-4938-a41a-7926b6c27acf"}',
  };

  const response = await fetch(
    "https://sandbox-integration-api.meshconnect.com/api/v1/linktoken",
    options
  );
  const data = await response.json();

  return NextResponse.json(data);
}
