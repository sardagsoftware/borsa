import { NextResponse } from "next/server";

export async function GET() {
  // Generate a secure random nonce
  const nonce = crypto.randomUUID().replace(/-/g, "");
  return new NextResponse(nonce);
}
