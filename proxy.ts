import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

// Publiczne ścieżki - dostępne bez logowania
const publicPaths = ['/login', '/register'];

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Sprawdź czy użytkownik jest zalogowany
    const session = await auth();

    // Jeśli użytkownik jest zalogowany i próbuje wejść na login/register
    if (session && publicPaths.some(path => pathname.startsWith(path))) {
        return NextResponse.redirect(new URL('/learn', request.url));
    }

    // Jeśli użytkownik NIE jest zalogowany i próbuje wejść na chronioną stronę
    if (!session && protectedPaths.some(path => pathname.startsWith(path))) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
