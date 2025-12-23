import NextAuth, { NextAuthConfig, Session } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { getSSOSession } from '@/lib/sso-session';

// Rozszerzenie typów NextAuth
declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            email: string;
            name?: string | null;
            image?: string | null;
            role: 'user' | 'admin';
        };
    }

    interface User {
        id: string;
        email: string;
        name?: string | null;
        image?: string | null;
        role: 'user' | 'admin';
    }
}

declare module '@auth/core/jwt' {
    interface JWT {
        id: string;
        role: 'user' | 'admin';
    }
}

export const authConfig: NextAuthConfig = {
    // Asercja typów wymagana ze względu na niezgodność wersji @auth/core
    // między next-auth (0.41.0) a @auth/drizzle-adapter (0.41.1)
    adapter: DrizzleAdapter(db) as NextAuthConfig['adapter'],
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
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Email i hasło są wymagane');
                }

                const user = await db.query.users.findFirst({
                    where: eq(users.email, credentials.email as string),
                });

                if (!user || !user.password) {
                    throw new Error('Nieprawidłowy email lub hasło');
                }

                if (user.isBlocked) {
                    throw new Error('To konto zostało zablokowane.');
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                );

                if (!isPasswordValid) {
                    throw new Error('Nieprawidłowy email lub hasło');
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image,
                    role: user.role,
                };
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
        async signIn({ user }) {
            if (!user.email) return false;

            const dbUser = await db.query.users.findFirst({
                where: eq(users.email, user.email),
                columns: { isBlocked: true }
            });

            if (dbUser?.isBlocked) {
                return false;
            }
            return true;
        },
        async jwt({ token, user, account }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
            }
            // Pobierz rolę z bazy jeśli nie ma w tokenie
            if (!token.role && token.email) {
                const dbUser = await db.query.users.findFirst({
                    where: eq(users.email, token.email as string),
                    columns: { role: true }
                });
                if (dbUser) {
                    token.role = dbUser.role;
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as 'user' | 'admin';
            }
            return session;
        },
    },
};

const nextAuth = NextAuth(authConfig);

// Eksportujemy handlers i signIn/signOut bezpośrednio
export const { handlers, signIn, signOut } = nextAuth;

// Oryginalny auth z NextAuth
const nextAuthAuth = nextAuth.auth;

/**
 * Zunifikowana funkcja auth() - sprawdza zarówno NextAuth jak i SSO session
 * 
 * Ta funkcja jest drop-in replacement dla oryginalnej auth() z NextAuth.
 * Jeśli NextAuth nie ma sesji, sprawdza ciasteczko SSO i zwraca sesję
 * w kompatybilnym formacie.
 */
export async function auth(): Promise<Session | null> {
    // 1. Najpierw sprawdzamy NextAuth
    const nextAuthSession = await nextAuthAuth();

    if (nextAuthSession?.user) {
        return nextAuthSession;
    }

    // 2. Jeśli nie ma NextAuth session, sprawdzamy SSO
    const ssoSession = await getSSOSession();

    if (ssoSession) {
        // Pobieramy aktualne dane użytkownika z bazy (rola mogła się zmienić)
        const dbUser = await db.query.users.findFirst({
            where: eq(users.id, ssoSession.userId),
            columns: {
                id: true,
                email: true,
                name: true,
                image: true,
                role: true,
                isBlocked: true,
            }
        });

        // Jeśli użytkownik nie istnieje lub jest zablokowany, sesja jest nieważna
        if (!dbUser || dbUser.isBlocked) {
            return null;
        }

        // Zwracamy sesję w formacie kompatybilnym z NextAuth Session
        return {
            user: {
                id: dbUser.id,
                email: dbUser.email,
                name: dbUser.name,
                image: dbUser.image,
                role: dbUser.role,
            },
            expires: new Date(ssoSession.expiresAt).toISOString(),
        };
    }

    return null;
}

