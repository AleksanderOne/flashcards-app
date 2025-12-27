/**
 * SSO Client - minimalna integracja z Centrum Logowania
 *
 * Ten plik zawiera całą logikę potrzebną do integracji z SSO centrum.
 * Wymagane zmienne środowiskowe:
 * - SSO_CENTER_URL (serwer)
 * - SSO_CLIENT_ID (serwer)
 * - SSO_API_KEY (serwer, tylko dla API routes)
 * - NEXT_PUBLIC_SSO_CENTER_URL (klient)
 * - NEXT_PUBLIC_SSO_CLIENT_ID (klient)
 */

import { cookies } from "next/headers";

// ============================================================================
// KONFIGURACJA
// ============================================================================

export const SSO_CONFIG = {
  // Domyślny URL (fallback)
  defaultCenterUrl:
    process.env.SSO_CENTER_URL || process.env.NEXT_PUBLIC_SSO_CENTER_URL || "",

  // Client ID (slug projektu z dashboardu centrum)
  clientId:
    process.env.SSO_CLIENT_ID || process.env.NEXT_PUBLIC_SSO_CLIENT_ID || "",

  // API Key do wymiany kodu (tylko serwer)
  apiKey: process.env.SSO_API_KEY || "",

  // Czas życia sesji (30 dni w ms)
  sessionMaxAge: 30 * 24 * 60 * 60 * 1000,

  // Czas między weryfikacjami Kill Switch (5 minut)
  verifyInterval: 5 * 60 * 1000,
};

/**
 * Pobiera URL centrum logowania.
 * W trybie development sprawdza ciasteczko `dev-sso-port` aby nadpisać port.
 */
async function getCenterUrl(): Promise<string> {
  const defaultUrl = SSO_CONFIG.defaultCenterUrl;

  // Tylko w trybie development
  if (process.env.NODE_ENV === "development") {
    try {
      const cookieStore = await cookies();
      const devPort = cookieStore.get("dev-sso-port")?.value;
      if (devPort && !isNaN(Number(devPort))) {
        return `http://localhost:${devPort}`;
      }
    } catch {
      // Ignoruj błędy (np. gdy wywołane poza kontekstem requestu)
    }
  }

  return defaultUrl;
}

// ============================================================================
// TYPY
// ============================================================================

/** Struktura sesji SSO przechowywanej w ciasteczku */
export interface SSOSession {
  userId: string;
  email: string;
  name: string | null;
  role: "user" | "admin";
  expiresAt: number;
  tokenVersion?: number; // Wersja tokenu (dla Kill Switch)
  lastVerified?: number; // Timestamp ostatniej weryfikacji
}

/** Odpowiedź z API /api/v1/token */
export interface SSOTokenResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    role: "user" | "admin";
    tokenVersion?: number;
  };
  project: {
    id: string;
    name: string;
  };
}

// ============================================================================
// FUNKCJE SESJI (Server-side)
// ============================================================================

/**
 * Pobiera sesję SSO z ciasteczka
 * @returns Sesja SSO lub null jeśli brak/wygasła
 */
export async function getSSOSession(): Promise<SSOSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("sso-session");

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
 * Usuwa sesję SSO (wylogowanie) i powiadamia centrum logowania
 */
export async function clearSSOSession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("sso-session");

  // Powiadom centrum logowania o wylogowaniu (jeśli mamy sesję)
  if (sessionCookie?.value) {
    try {
      const session: SSOSession = JSON.parse(sessionCookie.value);
      await logoutFromCenter(session.userId);
    } catch {
      // Ignoruj błędy - wylogowanie lokalne jest ważniejsze
    }
  }

  cookieStore.delete("sso-session");
}

/**
 * Informuje centrum logowania o wylogowaniu użytkownika
 */
export async function logoutFromCenter(userId: string): Promise<void> {
  const { clientId } = SSO_CONFIG;
  // Pobieramy URL (w tym obsługa dev port)
  const centerUrl = await getCenterUrl();

  if (!centerUrl) {
    return; // Brak konfiguracji
  }

  try {
    await fetch(`${centerUrl}/api/v1/public/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        projectSlug: clientId,
      }),
    });
  } catch (error) {
    console.warn("[SSO] Błąd wylogowania z centrum:", error);
  }
}

// ============================================================================
// FUNKCJE API (Server-side)
// ============================================================================

/**
 * Wymienia kod autoryzacyjny na dane użytkownika
 * Używane w /api/auth/sso-callback
 */
export async function exchangeCodeForUser(
  code: string,
  redirectUri: string,
): Promise<SSOTokenResponse | null> {
  const { apiKey } = SSO_CONFIG;
  const centerUrl = await getCenterUrl();

  try {
    const response = await fetch(`${centerUrl}/api/v1/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("SSO code exchange failed:", error);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("SSO code exchange error:", error);
    return null;
  }
}

/**
 * Weryfikuje sesję z centrum (Kill Switch)
 * Sprawdza czy użytkownik nie został wylogowany ze wszystkich urządzeń
 */
export async function verifySessionWithCenter(
  userId: string,
  tokenVersion: number,
): Promise<boolean> {
  const { apiKey } = SSO_CONFIG;
  const centerUrl = await getCenterUrl();

  try {
    const response = await fetch(`${centerUrl}/api/v1/session/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        userId,
        tokenVersion,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("SSO session verification failed");
      return false;
    }

    const result = await response.json();
    return result.valid === true;
  } catch (error) {
    console.error("SSO session verification error:", error);
    // Fail-open: w przypadku błędu sieci uznajemy sesję za ważną
    return true;
  }
}

// ============================================================================
// HELPERY
// ============================================================================

/**
 * Generuje URL callbacku dla danego origin
 */
export function getCallbackUrl(baseUrl: string): string {
  return `${baseUrl}/api/auth/sso-callback`;
}
