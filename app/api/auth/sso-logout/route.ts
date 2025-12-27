import { NextRequest, NextResponse } from "next/server";
import { clearSSOSession } from "@/lib/sso-client";

/**
 * Endpoint wylogowania z SSO
 * Usuwa lokalną sesję i przekierowuje na stronę logowania
 */
export async function GET(request: NextRequest) {
  console.log("[SSO-LOGOUT] GET /api/auth/sso-logout wywołane");
  await clearSSOSession();
  console.log("[SSO-LOGOUT] Przekierowuję na /login");
  return NextResponse.redirect(new URL("/login", request.nextUrl.origin));
}

export async function POST(_request: NextRequest) {
  console.log("[SSO-LOGOUT] POST /api/auth/sso-logout wywołane");
  await clearSSOSession();
  console.log("[SSO-LOGOUT] Zwracam success: true");
  return NextResponse.json({ success: true });
}
