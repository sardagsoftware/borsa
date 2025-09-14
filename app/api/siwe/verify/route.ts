import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const DOMAIN = process.env.SIWE_DOMAIN || "localhost";
const EXPIRY_MINUTES = Number(process.env.SIWE_EXP_MIN) || 30;

export async function POST(req: NextRequest) {
  try {
    const { message, signature, address } = await req.json();

    // Basic validation
    if (!message || !signature || !address) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    // Validate domain in message
    if (!message.includes(`domain: ${DOMAIN}`)) {
      return NextResponse.json({ ok: false, error: "Invalid domain" }, { status: 401 });
    }

    // Validate address in message
    if (!message.includes(`address: ${address.toLowerCase()}`)) {
      return NextResponse.json({ ok: false, error: "Address mismatch" }, { status: 401 });
    }

    // TODO: In production, implement proper EIP-191/EIP-1271 signature verification using viem
    // For now, we'll do basic validation that signature exists and is properly formatted
    if (signature.length < 130) { // Basic length check for Ethereum signatures
      return NextResponse.json({ ok: false, error: "Invalid signature format" }, { status: 401 });
    }

    // Create session
    const sessionId = crypto.randomUUID();
    const response = NextResponse.json({ 
      ok: true, 
      sessionId,
      address: address.toLowerCase(),
      expiresAt: new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000).toISOString()
    });

    // Set HttpOnly session cookie
    response.cookies.set("x-sid", sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: EXPIRY_MINUTES * 60,
      path: "/"
    });

    // Set address cookie (not HttpOnly, for client-side access)
    response.cookies.set("x-wallet-address", address.toLowerCase(), {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: EXPIRY_MINUTES * 60,
      path: "/"
    });

    return response;

  } catch (error) {
    console.error("SIWE verification error:", error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
