import { auth } from '@/lib/auth';
import { getSSOSession, SSOSession } from '@/lib/sso-session';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Zunifikowana struktura sesji użytkownika
 * Kompatybilna z NextAuth session.user
 */
export interface UnifiedSession {
    user: {
        id: string;
        email: string;
        name?: string | null;
        image?: string | null;
        role: 'user' | 'admin';
    };
    // Informacja o źródle sesji (dla debugowania)
    source: 'nextauth' | 'sso';
}

/**
 * Pobiera zunifikowaną sesję użytkownika
 * 
 * Sprawdza zarówno NextAuth jak i SSO session.
 * Używaj tej funkcji zamiast bezpośredniego auth() w Server Components.
 */
export async function getUnifiedSession(): Promise<UnifiedSession | null> {
    // 1. Najpierw sprawdzamy NextAuth (legacy)
    const nextAuthSession = await auth();

    if (nextAuthSession?.user) {
        return {
            user: {
                id: nextAuthSession.user.id,
                email: nextAuthSession.user.email,
                name: nextAuthSession.user.name,
                image: nextAuthSession.user.image,
                role: nextAuthSession.user.role,
            },
            source: 'nextauth',
        };
    }

    // 2. Jeśli nie ma NextAuth, sprawdzamy SSO
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

        return {
            user: {
                id: dbUser.id,
                email: dbUser.email,
                name: dbUser.name,
                image: dbUser.image,
                role: dbUser.role,
            },
            source: 'sso',
        };
    }

    return null;
}

/**
 * Alias dla kompatybilności wstecznej - zwraca session w formacie NextAuth
 * 
 * Używaj w miejscach gdzie potrzebujesz drop-in replacement dla auth()
 */
export async function getSession() {
    const unified = await getUnifiedSession();
    return unified ? { user: unified.user } : null;
}
