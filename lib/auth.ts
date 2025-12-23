import { getSSOSession, clearSSOSession, verifySessionWithCenter, SSO_CONFIG } from '@/lib/sso-client';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Typ sesji użytkownika - kompatybilny z poprzednim NextAuth Session
 */
export interface Session {
    user: {
        id: string;
        email: string;
        name?: string | null;
        image?: string | null;
        role: 'user' | 'admin';
    };
    expires: string;
}



/**
 * Główna funkcja auth() - sprawdza sesję SSO z centrum logowania
 * 
 * Flow:
 * 1. Pobiera sesję z ciasteczka sso-session
 * 2. Weryfikuje ważność sesji (czas wygaśnięcia)
 * 3. Co 5 minut weryfikuje z centrum (Kill Switch)
 * 4. Pobiera aktualne dane użytkownika z lokalnej bazy
 * 
 * Zwraca obiekt Session dla łatwej migracji z NextAuth.
 */
export async function auth(): Promise<Session | null> {
    // 1. Pobieramy sesję SSO z ciasteczka
    const ssoSession = await getSSOSession();

    if (!ssoSession) {
        return null;
    }

    // 2. Weryfikacja Kill Switch (co 5 minut)
    const now = Date.now();
    const lastVerified = ssoSession.lastVerified || 0;
    const needsVerification = (now - lastVerified) > SSO_CONFIG.verifyInterval;

    if (needsVerification && ssoSession.tokenVersion) {
        const isValid = await verifySessionWithCenter(
            ssoSession.userId,
            ssoSession.tokenVersion
        );

        if (!isValid) {
            // Sesja została unieważniona w centrum (Kill Switch)
            await clearSSOSession();
            return null;
        }

        // TODO: Aktualizacja lastVerified w ciasteczku wymaga response
        // Na razie weryfikacja działa, ale ciasteczko nie jest aktualizowane
    }

    // 3. Pobieramy aktualne dane użytkownika z lokalnej bazy
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

    // 4. Zwracamy sesję
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
