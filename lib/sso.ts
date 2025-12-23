/**
 * Konfiguracja SSO z Centrum Logowania (OAuth2 Authorization Code Flow)
 * 
 * Wymagane zmienne środowiskowe w .env.local:
 * - SSO_CENTER_URL=https://centrum-logowania-app-y7gt.vercel.app
 * - SSO_CLIENT_ID=flashcards-uk61 (slug projektu z dashboardu centrum)
 * - SSO_API_KEY=twoj_api_key (z dashboardu centrum)
 */

export const SSO_CONFIG = {
    // URL centrum logowania
    centerUrl: process.env.SSO_CENTER_URL || 'https://centrum-logowania-app-y7gt.vercel.app',

    // Slug projektu (client_id z dashboardu centrum)
    clientId: process.env.SSO_CLIENT_ID || '',

    // API Key do wymiany kodu na dane użytkownika
    apiKey: process.env.SSO_API_KEY || '',

    // URL callbacku w flashcards-app (gdzie centrum odsyła po logowaniu)
    getCallbackUrl: (baseUrl: string) => `${baseUrl}/api/auth/sso-callback`,
};

/**
 * Generuje URL do przekierowania na stronę logowania centrum
 */
export function getSSOLoginUrl(baseUrl: string): string {
    const { centerUrl, clientId, getCallbackUrl } = SSO_CONFIG;
    const redirectUri = encodeURIComponent(getCallbackUrl(baseUrl));
    return `${centerUrl}/authorize?client_id=${clientId}&redirect_uri=${redirectUri}`;
}

/**
 * Wymienia kod autoryzacyjny na dane użytkownika przez API centrum
 * 
 * Flow OAuth2 Authorization Code:
 * 1. Użytkownik loguje się w centrum
 * 2. Centrum przekierowuje z ?code=AUTHORIZATION_CODE
 * 3. Ta funkcja wymienia kod na dane użytkownika
 */
export async function exchangeCodeForUser(
    code: string,
    redirectUri: string
): Promise<SSOTokenResponse | null> {
    const { centerUrl, apiKey } = SSO_CONFIG;

    try {
        const response = await fetch(`${centerUrl}/api/v1/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
            },
            body: JSON.stringify({
                code,
                redirect_uri: redirectUri
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('SSO code exchange failed:', error);
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('SSO code exchange error:', error);
        return null;
    }
}

/**
 * Weryfikuje sesję użytkownika z centrum (sprawdza Kill Switch)
 * 
 * Wywoływane okresowo żeby sprawdzić czy użytkownik nie został wylogowany
 * ze wszystkich urządzeń w centrum logowania.
 */
export async function verifySessionWithCenter(
    userId: string,
    tokenVersion: number
): Promise<boolean> {
    const { centerUrl, apiKey } = SSO_CONFIG;

    try {
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
            // Nie cache'ujemy weryfikacji
            cache: 'no-store',
        });

        if (!response.ok) {
            console.error('SSO session verification failed');
            return false;
        }

        const result = await response.json();
        return result.valid === true;
    } catch (error) {
        console.error('SSO session verification error:', error);
        // W przypadku błędu sieci, uznajemy sesję za ważną (fail-open)
        return true;
    }
}

// Typy odpowiedzi z API centrum
export interface SSOTokenResponse {
    user: {
        id: string;
        email: string;
        name: string | null;
        image: string | null;
        role: 'user' | 'admin';
        tokenVersion?: number; // Wersja tokenu dla Kill Switch
    };
    project: {
        id: string;
        name: string;
    };
}
