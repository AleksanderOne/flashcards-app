import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy dla Edge Runtime - ochrona tras
 * 
 * Sprawdza sesję SSO z ciasteczka i przekierowuje niezalogowanych użytkowników.
 */

/**
 * Sprawdza czy użytkownik ma aktywną sesję SSO
 */
function hasSSOSession(request: NextRequest): boolean {
    try {
        const ssoCookie = request.cookies.get('sso-session');

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
export function proxy(request: NextRequest) {
    const isLoggedIn = hasSSOSession(request);
    const pathname = request.nextUrl.pathname;

    // Chronione ścieżki - wymagają zalogowania
    const protectedPaths = [
        '/learn',
        '/challenge',
        '/my-words',
        '/all-words',
        '/statistics',
        '/achievements',
        '/print-words',
        '/settings',
        '/admin',
    ];

    // Publiczne ścieżki (tylko dla niezalogowanych)
    const publicAuthPaths = ['/login'];

    const isProtectedRoute = protectedPaths.some(path => pathname.startsWith(path));
    const isPublicAuthRoute = publicAuthPaths.some(path => pathname.startsWith(path));

    // Zalogowany użytkownik próbuje wejść na login -> przekieruj do /learn
    if (isLoggedIn && isPublicAuthRoute) {
        return NextResponse.redirect(new URL('/learn', request.nextUrl));
    }

    // Niezalogowany użytkownik próbuje wejść na chronioną stronę -> przekieruj do /login
    if (!isLoggedIn && isProtectedRoute) {
        const loginUrl = new URL('/login', request.nextUrl);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Chronione trasy
        '/learn/:path*',
        '/challenge/:path*',
        '/my-words/:path*',
        '/all-words/:path*',
        '/statistics/:path*',
        '/achievements/:path*',
        '/print-words/:path*',
        '/settings/:path*',
        '/admin/:path*',
        // Auth trasy
        '/login',
    ],
};
