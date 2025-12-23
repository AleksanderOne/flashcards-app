import type { NextAuthConfig } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { NextRequest } from 'next/server';

/**
 * Konfiguracja auth dla Edge Runtime (middleware/proxy).
 * Ta konfiguracja NIE zawiera DrizzleAdapter, ponieważ Edge Runtime
 * nie obsługuje bezpośrednich połączeń TCP do bazy danych.
 * 
 * Używamy strategii JWT dla sesji - token zawiera wszystkie potrzebne dane.
 * 
 * UWAGA: Obsługuje również sesje SSO z ciasteczka 'sso-session'.
 */

/**
 * Sprawdza czy użytkownik ma aktywną sesję SSO
 */
function hasSSOSession(request: NextRequest): boolean {
    try {
        // Używamy NextRequest.cookies API
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

export const authConfig: NextAuthConfig = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize() {
                // W Edge Runtime nie sprawdzamy hasła - to robi pełna konfiguracja auth
                // Middleware tylko sprawdza czy token JWT istnieje
                return null;
            },
        }),
    ],
    pages: {
        signIn: '/login',
        signOut: '/login',
        error: '/login',
    },
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 dni
    },
    callbacks: {
        authorized({ auth, request }) {
            // Sprawdzamy zarówno NextAuth jak i SSO
            const isLoggedInNextAuth = !!auth?.user;
            const isLoggedInSSO = hasSSOSession(request as NextRequest);
            const isLoggedIn = isLoggedInNextAuth || isLoggedInSSO;

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
            const publicPaths = ['/login', '/register'];

            const isProtectedRoute = protectedPaths.some(path => pathname.startsWith(path));
            const isPublicRoute = publicPaths.some(path => pathname.startsWith(path));

            // Zalogowany użytkownik próbuje wejść na login/register -> przekieruj do /learn
            if (isLoggedIn && isPublicRoute) {
                return Response.redirect(new URL('/learn', request.nextUrl));
            }

            // Niezalogowany użytkownik próbuje wejść na chronioną stronę -> przekieruj do /login
            if (!isLoggedIn && isProtectedRoute) {
                return Response.redirect(new URL('/login', request.nextUrl));
            }

            return true;
        },
    },
};
