import { NextRequest, NextResponse } from "next/server";
import { checkAuthRateLimit, checkApiRateLimit } from "@/lib/rate-limit";

/**
 * Proxy dla Edge Runtime - ochrona tras i rate limiting
 *
 * Sprawdza sesję SSO z ciasteczka i przekierowuje niezalogowanych użytkowników.
 * Implementuje rate limiting dla API endpoints.
 */

/**
 * Pobiera identyfikator użytkownika z requestu (IP)
 */
function getIdentifier(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");

  const ip =
    forwardedFor?.split(",")[0]?.trim() ||
    realIp ||
    cfConnectingIp ||
    "anonymous";

  return ip;
}

/**
 * Tworzy odpowiedź 429 Too Many Requests
 */
function rateLimitResponse(
  limit: number,
  remaining: number,
  reset: number,
): NextResponse {
  return NextResponse.json(
    {
      error: "Too Many Requests",
      message: "Przekroczono limit zapytań. Spróbuj ponownie później.",
      retryAfter: Math.ceil((reset - Date.now()) / 1000),
    },
    {
      status: 429,
      headers: {
        "X-RateLimit-Limit": limit.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": reset.toString(),
        "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
      },
    },
  );
}

/**
 * Sprawdza czy użytkownik ma aktywną sesję SSO
 */
function hasSSOSession(request: NextRequest): boolean {
  try {
    const ssoCookie = request.cookies.get("sso-session");

    if (!ssoCookie?.value) return false;

    // Dekodujemy wartość ciasteczka
    const decodedValue = decodeURIComponent(ssoCookie.value);
    const session = JSON.parse(decodedValue);

    // Sprawdzamy czy sesja nie wygasła
    return session.expiresAt > Date.now();
  } catch {
    return false;
  }
}

/**
 * Główna funkcja proxy (middleware)
 */
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const identifier = getIdentifier(request);

  // ========== RATE LIMITING DLA API ==========

  // Rate limiting dla auth endpoints (najbardziej restrykcyjny)
  if (pathname.startsWith("/api/auth")) {
    const result = await checkAuthRateLimit(identifier);

    if (!result.success) {
      console.warn(`[Rate Limit] Auth blocked: ${identifier} on ${pathname}`);
      return rateLimitResponse(result.limit, result.remaining, result.reset);
    }
  }

  // Rate limiting dla pozostałych API endpoints
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth")) {
    const result = await checkApiRateLimit(identifier);

    if (!result.success) {
      console.warn(`[Rate Limit] API blocked: ${identifier} on ${pathname}`);
      return rateLimitResponse(result.limit, result.remaining, result.reset);
    }
  }

  // ========== OCHRONA TRAS (SSO) ==========

  const isLoggedIn = hasSSOSession(request);

  // Chronione ścieżki - wymagają zalogowania
  const protectedPaths = [
    "/learn",
    "/challenge",
    "/my-words",
    "/all-words",
    "/statistics",
    "/achievements",
    "/print-words",
    "/settings",
    "/admin",
  ];

  // Publiczne ścieżki (tylko dla niezalogowanych)
  const publicAuthPaths = ["/login"];

  const isProtectedRoute = protectedPaths.some((path) =>
    pathname.startsWith(path),
  );
  const isPublicAuthRoute = publicAuthPaths.some((path) =>
    pathname.startsWith(path),
  );

  // Zalogowany użytkownik próbuje wejść na login -> przekieruj do /learn
  if (isLoggedIn && isPublicAuthRoute) {
    return NextResponse.redirect(new URL("/learn", request.nextUrl));
  }

  // Niezalogowany użytkownik próbuje wejść na chronioną stronę -> przekieruj do /login
  if (!isLoggedIn && isProtectedRoute) {
    const loginUrl = new URL("/login", request.nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ========== KONTYNUUJ ==========
  // Security headers są już zdefiniowane w next.config.ts
  return NextResponse.next();
}

export const config = {
  matcher: [
    // API routes (rate limiting)
    "/api/:path*",
    // Chronione trasy
    "/learn/:path*",
    "/challenge/:path*",
    "/my-words/:path*",
    "/all-words/:path*",
    "/statistics/:path*",
    "/achievements/:path*",
    "/print-words/:path*",
    "/settings/:path*",
    "/admin/:path*",
    // Auth trasy
    "/login",
  ],
};
