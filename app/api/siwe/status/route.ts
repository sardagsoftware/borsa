import { NextRequest, NextResponse } from "next/server";
import { isWalletVerified } from "@/lib/wallet/gate";

export async function GET(req: NextRequest) {
  const isVerified = isWalletVerified();
  const address = req.cookies.get("x-wallet-address")?.value;
  
  return NextResponse.json({
    verified: isVerified,
    address: address || null,
    timestamp: new Date().toISOString()
  });
}
