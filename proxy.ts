import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

/**
 * Middleware autoryzacji dla Edge Runtime.
 * 
 * WAŻNE: Używamy auth.config.ts zamiast auth.ts, ponieważ:
 * - Edge Runtime na Vercelu nie obsługuje połączeń TCP do bazy danych
 * - DrizzleAdapter wymaga bezpośredniego połączenia z bazą
 * - Callback `authorized` w authConfig obsługuje logikę przekierowań
 * 
 * Logika przekierowań jest zdefiniowana w lib/auth.config.ts -> callbacks.authorized
 */
const { auth } = NextAuth(authConfig);

// Next.js 16 wymaga eksportu funkcji o nazwie "proxy"
export const proxy = auth;

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
