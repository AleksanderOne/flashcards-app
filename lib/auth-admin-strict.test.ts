/**
 * Testy dla modułu auth-admin-strict (fail-closed autoryzacja)
 * 
 * Testuje krytyczną logikę autoryzacji admina z fail-closed behavior:
 * - Odmowa dostępu gdy brak sesji
 * - Odmowa dostępu dla użytkowników nie-admin
 * - Odmowa dostępu przy błędzie weryfikacji SSO
 * - Sukces tylko dla zweryfikowanego admina
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mockowanie zależności
vi.mock('./auth', () => ({
    auth: vi.fn(),
}));

vi.mock('./sso-client', () => ({
    getSSOSession: vi.fn(),
    verifySessionWithCenter: vi.fn(),
}));

// Import po mockowaniu
import { authAdminStrict, requireAdminStrict } from './auth-admin-strict';
import { auth } from './auth';
import { getSSOSession } from './sso-client';

// Mock globalnego fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Auth Admin Strict (Fail-Closed)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Domyślna konfiguracja środowiska
        process.env.SSO_CENTER_URL = 'https://sso.example.com';
        process.env.SSO_API_KEY = 'test-api-key';
    });

    afterEach(() => {
        delete process.env.SSO_CENTER_URL;
        delete process.env.SSO_API_KEY;
    });

    describe('authAdminStrict', () => {
        it('powinien zwrócić null gdy brak sesji', async () => {
            (auth as any).mockResolvedValue(null);

            const result = await authAdminStrict();

            expect(result).toBeNull();
        });

        it('powinien zwrócić null gdy brak user.id w sesji', async () => {
            (auth as any).mockResolvedValue({ user: {} });

            const result = await authAdminStrict();

            expect(result).toBeNull();
        });

        it('powinien zwrócić null dla użytkownika z rolą user (nie admin)', async () => {
            (auth as any).mockResolvedValue({
                user: { id: 'user-123', role: 'user' }
            });

            const result = await authAdminStrict();

            expect(result).toBeNull();
            // Nie powinien nawet próbować pobierać sesji SSO
            expect(getSSOSession).not.toHaveBeenCalled();
        });

        it('powinien zwrócić null gdy brak tokenVersion w sesji SSO', async () => {
            (auth as any).mockResolvedValue({
                user: { id: 'admin-123', role: 'admin' }
            });
            (getSSOSession as any).mockResolvedValue({
                userId: 'admin-123',
                // brak tokenVersion
            });

            const result = await authAdminStrict();

            expect(result).toBeNull();
        });

        it('powinien zwrócić null gdy brak sesji SSO', async () => {
            (auth as any).mockResolvedValue({
                user: { id: 'admin-123', role: 'admin' }
            });
            (getSSOSession as any).mockResolvedValue(null);

            const result = await authAdminStrict();

            expect(result).toBeNull();
        });

        it('powinien zwrócić null gdy weryfikacja SSO zwraca false', async () => {
            (auth as any).mockResolvedValue({
                user: { id: 'admin-123', role: 'admin' }
            });
            (getSSOSession as any).mockResolvedValue({
                userId: 'admin-123',
                tokenVersion: 1,
            });
            // Mock fetch zwraca valid: false
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ valid: false }),
            });

            const result = await authAdminStrict();

            expect(result).toBeNull();
        });

        it('powinien zwrócić null (fail-closed) gdy fetch rzuca błąd', async () => {
            (auth as any).mockResolvedValue({
                user: { id: 'admin-123', role: 'admin' }
            });
            (getSSOSession as any).mockResolvedValue({
                userId: 'admin-123',
                tokenVersion: 1,
            });
            // Symulacja błędu sieci
            mockFetch.mockRejectedValue(new Error('Network error'));

            const result = await authAdminStrict();

            // Fail-closed: błąd = odmowa dostępu
            expect(result).toBeNull();
        });

        it('powinien zwrócić null (fail-closed) gdy response.ok = false', async () => {
            (auth as any).mockResolvedValue({
                user: { id: 'admin-123', role: 'admin' }
            });
            (getSSOSession as any).mockResolvedValue({
                userId: 'admin-123',
                tokenVersion: 1,
            });
            // Symulacja błędu HTTP
            mockFetch.mockResolvedValue({
                ok: false,
            });

            const result = await authAdminStrict();

            expect(result).toBeNull();
        });

        it('powinien zwrócić sesję dla zweryfikowanego admina', async () => {
            const adminSession = {
                user: { id: 'admin-123', role: 'admin', email: 'admin@example.com' }
            };
            (auth as any).mockResolvedValue(adminSession);
            (getSSOSession as any).mockResolvedValue({
                userId: 'admin-123',
                tokenVersion: 5,
            });
            // Mock fetch zwraca valid: true
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ valid: true }),
            });

            const result = await authAdminStrict();

            expect(result).toEqual(adminSession);
            expect(mockFetch).toHaveBeenCalledWith(
                'https://sso.example.com/api/v1/session/verify',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({
                        userId: 'admin-123',
                        tokenVersion: 5,
                    }),
                })
            );
        });

        it('powinien zwrócić null gdy brak konfiguracji SSO', async () => {
            delete process.env.SSO_CENTER_URL;
            delete process.env.SSO_API_KEY;

            (auth as any).mockResolvedValue({
                user: { id: 'admin-123', role: 'admin' }
            });
            (getSSOSession as any).mockResolvedValue({
                userId: 'admin-123',
                tokenVersion: 1,
            });

            const result = await authAdminStrict();

            // Brak konfiguracji = odmowa (catch block)
            expect(result).toBeNull();
        });
    });

    describe('requireAdminStrict', () => {
        it('powinien rzucić błąd gdy authAdminStrict zwraca null', async () => {
            (auth as any).mockResolvedValue(null);

            await expect(requireAdminStrict()).rejects.toThrow(
                'Brak uprawnień administratora lub sesja wygasła'
            );
        });

        it('powinien nie rzucać błędu dla zweryfikowanego admina', async () => {
            (auth as any).mockResolvedValue({
                user: { id: 'admin-123', role: 'admin' }
            });
            (getSSOSession as any).mockResolvedValue({
                userId: 'admin-123',
                tokenVersion: 1,
            });
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ valid: true }),
            });

            await expect(requireAdminStrict()).resolves.not.toThrow();
        });
    });
});
