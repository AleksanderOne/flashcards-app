/**
 * Testy dla modułu SSO Client
 *
 * Testuje funkcje integracji z Centrum Logowania:
 * - Pobieranie sesji z ciasteczka
 * - Wymiana kodu autoryzacyjnego na dane użytkownika
 * - Weryfikacja sesji z centrum (Kill Switch)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mockowanie next/headers przed importem modułu
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

// Import po mockowaniu
import {
  SSO_CONFIG,
  getSSOSession,
  clearSSOSession,
  exchangeCodeForUser,
  verifySessionWithCenter,
  getCallbackUrl,
} from "./sso-client";
import { cookies } from "next/headers";

// Pomocniczy mock dla fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("SSO Client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  describe("SSO_CONFIG", () => {
    it("powinien mieć zdefiniowane wartości konfiguracji", () => {
      expect(SSO_CONFIG).toBeDefined();
      expect(SSO_CONFIG.sessionMaxAge).toBe(30 * 24 * 60 * 60 * 1000); // 30 dni
      expect(SSO_CONFIG.verifyInterval).toBe(5 * 60 * 1000); // 5 minut
    });
  });

  describe("getSSOSession", () => {
    it("powinien zwrócić null gdy brak ciasteczka", async () => {
      const mockCookieStore = {
        get: vi.fn().mockReturnValue(undefined),
      };
      (cookies as any).mockResolvedValue(mockCookieStore);

      const result = await getSSOSession();

      expect(result).toBeNull();
      expect(mockCookieStore.get).toHaveBeenCalledWith("sso-session");
    });

    it("powinien zwrócić null gdy ciasteczko jest puste", async () => {
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "" }),
      };
      (cookies as any).mockResolvedValue(mockCookieStore);

      const result = await getSSOSession();

      expect(result).toBeNull();
    });

    it("powinien zwrócić null gdy sesja wygasła", async () => {
      const expiredSession = {
        userId: "user-123",
        email: "user@example.com",
        name: "Test User",
        role: "user",
        expiresAt: Date.now() - 1000, // Wygasła 1 sekundę temu
      };
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: JSON.stringify(expiredSession) }),
      };
      (cookies as any).mockResolvedValue(mockCookieStore);

      const result = await getSSOSession();

      expect(result).toBeNull();
    });

    it("powinien zwrócić sesję gdy jest ważna", async () => {
      const validSession = {
        userId: "user-123",
        email: "user@example.com",
        name: "Test User",
        role: "user" as const,
        expiresAt: Date.now() + 3600000, // Wygasa za godzinę
        tokenVersion: 1,
      };
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: JSON.stringify(validSession) }),
      };
      (cookies as any).mockResolvedValue(mockCookieStore);

      const result = await getSSOSession();

      expect(result).toEqual(validSession);
    });

    it("powinien zwrócić null przy błędzie parsowania JSON", async () => {
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "nieprawidłowy-json" }),
      };
      (cookies as any).mockResolvedValue(mockCookieStore);

      const result = await getSSOSession();

      expect(result).toBeNull();
    });
  });

  describe("clearSSOSession", () => {
    it("powinien usunąć ciasteczko sesji gdy brak sesji", async () => {
      const mockCookieStore = {
        get: vi.fn().mockReturnValue(undefined),
        delete: vi.fn(),
      };
      (cookies as any).mockResolvedValue(mockCookieStore);

      await clearSSOSession();

      expect(mockCookieStore.delete).toHaveBeenCalledWith("sso-session");
      expect(mockFetch).not.toHaveBeenCalled(); // Brak sesji = brak powiadomienia centrum
    });

    it("powinien powiadomić centrum i usunąć ciasteczko gdy sesja istnieje", async () => {
      const validSession = {
        userId: "user-123",
        email: "user@example.com",
        name: "Test User",
        role: "user",
        expiresAt: Date.now() + 3600000,
      };
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: JSON.stringify(validSession) }),
        delete: vi.fn(),
      };
      (cookies as any).mockResolvedValue(mockCookieStore);
      mockFetch.mockResolvedValue({ ok: true });

      await clearSSOSession();

      expect(mockCookieStore.delete).toHaveBeenCalledWith("sso-session");
      // Sprawdzamy że centrum zostało powiadomione
      expect(mockFetch).toHaveBeenCalled();
      expect(mockFetch.mock.calls[0][0]).toContain("/api/v1/public/logout");
      expect(mockFetch.mock.calls[0][1].method).toBe("POST");
    });

    it("powinien usunąć ciasteczko nawet gdy powiadomienie centrum się nie uda", async () => {
      const validSession = {
        userId: "user-123",
        email: "user@example.com",
        name: "Test User",
        role: "user",
        expiresAt: Date.now() + 3600000,
      };
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: JSON.stringify(validSession) }),
        delete: vi.fn(),
      };
      (cookies as any).mockResolvedValue(mockCookieStore);
      mockFetch.mockRejectedValue(new Error("Network error"));

      await clearSSOSession();

      // Ciasteczko usunięte mimo błędu sieci
      expect(mockCookieStore.delete).toHaveBeenCalledWith("sso-session");
    });
  });

  describe("exchangeCodeForUser", () => {
    const testCode = "auth-code-123";
    const testRedirectUri = "http://localhost:3000/api/auth/sso-callback";

    it("powinien zwrócić null przy błędzie HTTP", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: "Invalid code" }),
      });

      const result = await exchangeCodeForUser(testCode, testRedirectUri);

      expect(result).toBeNull();
    });

    it("powinien zwrócić null przy błędzie sieciowym", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      const result = await exchangeCodeForUser(testCode, testRedirectUri);

      expect(result).toBeNull();
    });

    it("powinien zwrócić dane użytkownika przy sukcesie", async () => {
      const mockTokenResponse = {
        user: {
          id: "user-123",
          email: "user@example.com",
          name: "Test User",
          image: null,
          role: "user",
          tokenVersion: 1,
        },
        project: {
          id: "project-123",
          name: "Flashcards App",
        },
      };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTokenResponse),
      });

      const result = await exchangeCodeForUser(testCode, testRedirectUri);

      expect(result).toEqual(mockTokenResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/token"),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({
            code: testCode,
            redirect_uri: testRedirectUri,
          }),
        }),
      );
    });
  });

  describe("verifySessionWithCenter", () => {
    const testUserId = "user-123";
    const testTokenVersion = 5;

    it("powinien zwrócić false przy błędzie HTTP", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
      });

      const result = await verifySessionWithCenter(
        testUserId,
        testTokenVersion,
      );

      expect(result).toBe(false);
    });

    it("powinien zwrócić true (fail-open) przy błędzie sieciowym", async () => {
      // Zgodnie z implementacją: fail-open dla normalnych weryfikacji
      mockFetch.mockRejectedValue(new Error("Network error"));

      const result = await verifySessionWithCenter(
        testUserId,
        testTokenVersion,
      );

      // verifySessionWithCenter jest fail-open (zwraca true przy błędzie sieci)
      expect(result).toBe(true);
    });

    it("powinien zwrócić false gdy sesja nieważna", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ valid: false }),
      });

      const result = await verifySessionWithCenter(
        testUserId,
        testTokenVersion,
      );

      expect(result).toBe(false);
    });

    it("powinien zwrócić true gdy sesja ważna", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ valid: true }),
      });

      const result = await verifySessionWithCenter(
        testUserId,
        testTokenVersion,
      );

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/session/verify"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            userId: testUserId,
            tokenVersion: testTokenVersion,
          }),
        }),
      );
    });
  });

  describe("getCallbackUrl", () => {
    it("powinien poprawnie generować URL callbacku", () => {
      const baseUrl = "https://flashcards.example.com";
      const result = getCallbackUrl(baseUrl);

      expect(result).toBe(
        "https://flashcards.example.com/api/auth/sso-callback",
      );
    });

    it("powinien obsługiwać URL z końcowym slashem", () => {
      const baseUrl = "https://flashcards.example.com/";
      const result = getCallbackUrl(baseUrl);

      // Funkcja nie usuwa slasha, więc będzie podwójny
      expect(result).toBe(
        "https://flashcards.example.com//api/auth/sso-callback",
      );
    });

    it("powinien obsługiwać localhost", () => {
      const baseUrl = "http://localhost:3000";
      const result = getCallbackUrl(baseUrl);

      expect(result).toBe("http://localhost:3000/api/auth/sso-callback");
    });
  });
});
