import { NextRequest, NextResponse } from "next/server";
import { clearSSOSession } from "@/lib/sso-client";

/**
 * Endpoint wylogowania z SSO
 * Usuwa lokalną sesję i przekierowuje na stronę logowania
 */
export async function GET(request: NextRequest) {
  await clearSSOSession();
  return NextResponse.redirect(new URL("/login", request.nextUrl.origin));
}

export async function POST(_request: NextRequest) {
  await clearSSOSession();
  return NextResponse.json({ success: true });
}
