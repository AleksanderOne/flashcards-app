import { cookies } from 'next/headers';

/**
 * Struktura sesji SSO przechowywanej w ciasteczku
 */
export interface SSOSession {
    userId: string;
    email: string;
    name: string | null;
    role: 'user' | 'admin';
    expiresAt: number;
}

/**
 * Pobiera sesję SSO z ciasteczka (dla Server Components i API routes)
 */
export async function getSSOSession(): Promise<SSOSession | null> {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('sso-session');

        if (!sessionCookie?.value) {
            return null;
        }

        const session: SSOSession = JSON.parse(sessionCookie.value);

        // Sprawdź czy sesja nie wygasła
        if (session.expiresAt < Date.now()) {
            return null;
        }

        return session;
    } catch {
        return null;
    }
}

/**
 * Usuwa sesję SSO (wylogowanie)
 */
export async function clearSSOSession(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete('sso-session');
}
