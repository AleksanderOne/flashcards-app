import type { NextAuthConfig } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';

/**
 * Konfiguracja auth dla Edge Runtime (middleware/proxy).
 * Ta konfiguracja NIE zawiera DrizzleAdapter, ponieważ Edge Runtime
 * nie obsługuje bezpośrednich połączeń TCP do bazy danych.
 * 
 * Używamy strategii JWT dla sesji - token zawiera wszystkie potrzebne dane.
 */
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
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const pathname = nextUrl.pathname;

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
                return Response.redirect(new URL('/learn', nextUrl));
            }

            // Niezalogowany użytkownik próbuje wejść na chronioną stronę -> przekieruj do /login
            if (!isLoggedIn && isProtectedRoute) {
                return Response.redirect(new URL('/login', nextUrl));
            }

            return true;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};
