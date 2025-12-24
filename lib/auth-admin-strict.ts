/**
 * Autoryzacja dla krytycznych operacji admina (fail-closed)
 * 
 * W przypadku błędu połączenia z centrum SSO - ODMOWA dostępu.
 * Używaj dla operacji: zmiana roli, usunięcie użytkownika, itp.
 */

import { auth } from './auth';
import { getSSOSession, verifySessionWithCenter } from './sso-client';

/**
 * Weryfikacja sesji admina z fail-closed behavior.
 * 
 * Różnica od zwykłego auth():
 * - Wymaga roli 'admin'
 * - Weryfikuje sesję z centrum SSO (nie tylko lokalnie)
 * - W przypadku błędu sieci - ODMOWA (nie zezwolenie)
 * 
 * @returns Session jeśli admin zweryfikowany, null w przeciwnym razie
 */
export async function authAdminStrict() {
    // Krok 1: Podstawowa weryfikacja sesji i roli
    const session = await auth();

    if (!session?.user?.id) {
        return null; // Brak sesji
    }

    if (session.user.role !== 'admin') {
        return null; // Nie admin
    }

    // Krok 2: Weryfikacja z centrum SSO (fail-closed)
    const ssoSession = await getSSOSession();

    if (!ssoSession?.tokenVersion) {
        // Brak tokenVersion = nie można zweryfikować z centrum
        // Dla krytycznych operacji - odmowa
        console.warn('[authAdminStrict] Brak tokenVersion w sesji SSO');
        return null;
    }

    try {
        const isValid = await verifySessionWithCenterStrict(
            ssoSession.userId,
            ssoSession.tokenVersion
        );

        if (!isValid) {
            console.warn('[authAdminStrict] Sesja SSO nieważna');
            return null;
        }

        return session;
    } catch (error) {
        // Fail-closed: błąd sieci = odmowa dostępu
        console.error('[authAdminStrict] Błąd weryfikacji SSO:', error);
        return null;
    }
}

/**
 * Weryfikacja sesji z centrum SSO (fail-closed version)
 * 
 * Różnica od verifySessionWithCenter:
 * - Rzuca błąd przy problemach sieciowych zamiast zwracać true
 */
async function verifySessionWithCenterStrict(
    userId: string,
    tokenVersion: number
): Promise<boolean> {
    const centerUrl = process.env.SSO_CENTER_URL;
    const apiKey = process.env.SSO_API_KEY;

    if (!centerUrl || !apiKey) {
        throw new Error('Brak konfiguracji SSO');
    }

    const response = await fetch(`${centerUrl}/api/v1/session/verify`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
        },
        body: JSON.stringify({
            userId,
            tokenVersion,
        }),
        cache: 'no-store',
    });

    if (!response.ok) {
        // Błąd odpowiedzi = sesja nieważna (nie throw, tylko false)
        return false;
    }

    const result = await response.json();
    return result.valid === true;
}

/**
 * Helper do sprawdzenia admina strict w Server Actions
 * 
 * @throws Error jeśli nie admin lub błąd weryfikacji
 */
export async function requireAdminStrict(): Promise<void> {
    const session = await authAdminStrict();
    if (!session) {
        throw new Error('Brak uprawnień administratora lub sesja wygasła');
    }
}
