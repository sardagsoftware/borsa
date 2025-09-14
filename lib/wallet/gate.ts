import { cookies } from "next/headers";

export function isWalletVerified(): boolean {
  const cookieStore = cookies();
  return Boolean(cookieStore.get("x-sid")?.value);
}

export function getWalletSession(): string | null {
  const cookieStore = cookies();
  return cookieStore.get("x-sid")?.value || null;
}
