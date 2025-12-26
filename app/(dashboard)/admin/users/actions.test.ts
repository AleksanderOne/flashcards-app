/**
 * Testy dla akcji administratora (users/actions.ts)
 * 
 * Testuje:
 * - Autoryzację dla operacji admina
 * - Fail-closed dla krytycznych operacji (toggleUserRole, deleteUser)
 * - Blokowanie/odblokowywanie użytkowników
 * - Tworzenie użytkownika z walidacją Zod
 * 
 * UWAGA: userIdSchema używa min(1).max(255), więc 'invalid-uuid' jest POPRAWNYM stringiem.
 * Testy walidacji UUID są w lib/validations/validations.test.ts dla wordIdSchema.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mockowanie zależności PRZED importem modułu
vi.mock('@/lib/auth', () => ({
    auth: vi.fn(),
}));

vi.mock('@/lib/db/drizzle', () => {
    const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
        }),
    });
    const mockDelete = vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
    });
    const mockInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
    });

    return {
        db: {
            query: {
                users: {
                    findFirst: vi.fn(),
                },
            },
            update: mockUpdate,
            delete: mockDelete,
            insert: mockInsert,
        },
    };
});

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

vi.mock('@/lib/auth-admin-strict', () => ({
    requireAdminStrict: vi.fn(),
}));

vi.mock('@/app/actions/user-data-actions', () => ({
    deleteUserData: vi.fn().mockResolvedValue({ success: true }),
    deleteUserHistory: vi.fn().mockResolvedValue({ success: true }),
    resetUserProgress: vi.fn().mockResolvedValue({ success: true }),
}));

// Import FUNKCJI po mockowaniu
import {
    toggleBlockUser,
    toggleUserRole,
    deleteUser,
    createUser,
    deleteUserData,
    deleteUserHistory,
    resetUserProgress,
} from './actions';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db/drizzle';
import { requireAdminStrict } from '@/lib/auth-admin-strict';

describe('Admin Users Actions', () => {
    // Prawidłowy UUID dla testów (userIdSchema akceptuje dowolny string 1-255 znaków)
    const validUserId = 'user-id-123';

    beforeEach(() => {
        vi.clearAllMocks();
        // Domyślnie nie-zalogowany
        (auth as any).mockResolvedValue(null);
        // Domyślnie requireAdminStrict rzuca błąd
        (requireAdminStrict as any).mockRejectedValue(
            new Error('Brak uprawnień administratora lub sesja wygasła')
        );
    });

    // Helper do mockowania admina
    const mockAdmin = () => {
        (auth as any).mockResolvedValue({
            user: { email: 'admin@example.com', role: 'admin' }
        });
        (db.query.users.findFirst as any).mockResolvedValue({ role: 'admin' });
    };

    // Helper do mockowania nie-admina
    const mockNonAdmin = () => {
        (auth as any).mockResolvedValue({
            user: { email: 'user@example.com', role: 'user' }
        });
        (db.query.users.findFirst as any).mockResolvedValue({ role: 'user' });
    };

    describe('toggleBlockUser', () => {
        it('powinien rzucić Unauthorized dla niezalogowanego użytkownika', async () => {
            await expect(toggleBlockUser(validUserId, true))
                .rejects.toThrow('Unauthorized');
        });

        it('powinien rzucić błąd dla nieprawidłowego statusu blokady', async () => {
            await expect(toggleBlockUser(validUserId, 'not-boolean'))
                .rejects.toThrow('Nieprawidłowy status blokady');
        });

        it('powinien rzucić Forbidden dla nie-admina', async () => {
            mockNonAdmin();

            await expect(toggleBlockUser(validUserId, true))
                .rejects.toThrow('Forbidden');
        });

        it('powinien zablokować użytkownika gdy admin', async () => {
            mockAdmin();

            await expect(toggleBlockUser(validUserId, false))
                .resolves.not.toThrow();

            expect(db.update).toHaveBeenCalled();
        });

        it('powinien odblokować użytkownika gdy admin', async () => {
            mockAdmin();

            await expect(toggleBlockUser(validUserId, true))
                .resolves.not.toThrow();

            expect(db.update).toHaveBeenCalled();
        });
    });

    describe('toggleUserRole (KRYTYCZNA OPERACJA - fail-closed)', () => {
        it('powinien używać fail-closed autoryzacji (requireAdminStrict)', async () => {
            (requireAdminStrict as any).mockResolvedValue(undefined);

            await toggleUserRole(validUserId, 'user');

            expect(requireAdminStrict).toHaveBeenCalled();
            expect(db.update).toHaveBeenCalled();
        });

        it('powinien rzucić błąd gdy requireAdminStrict rzuca (fail-closed)', async () => {
            // Domyślny mock już rzuca błąd
            await expect(toggleUserRole(validUserId, 'user'))
                .rejects.toThrow('Brak uprawnień administratora lub sesja wygasła');
        });

        it('powinien rzucić błąd dla nieprawidłowej roli', async () => {
            (requireAdminStrict as any).mockResolvedValue(undefined);

            await expect(toggleUserRole(validUserId, 'superadmin'))
                .rejects.toThrow('Nieprawidłowa rola użytkownika');
        });

        it('powinien zmienić rolę gdy admin zweryfikowany przez SSO', async () => {
            (requireAdminStrict as any).mockResolvedValue(undefined);

            await toggleUserRole(validUserId, 'user');

            expect(db.update).toHaveBeenCalled();
        });
    });

    describe('deleteUser (KRYTYCZNA OPERACJA - fail-closed)', () => {
        it('powinien używać fail-closed autoryzacji (requireAdminStrict)', async () => {
            (requireAdminStrict as any).mockResolvedValue(undefined);

            await deleteUser(validUserId);

            expect(requireAdminStrict).toHaveBeenCalled();
            expect(db.delete).toHaveBeenCalled();
        });

        it('powinien rzucić błąd gdy requireAdminStrict rzuca (fail-closed)', async () => {
            await expect(deleteUser(validUserId))
                .rejects.toThrow('Brak uprawnień administratora lub sesja wygasła');
        });

        it('powinien usunąć użytkownika gdy admin zweryfikowany przez SSO', async () => {
            (requireAdminStrict as any).mockResolvedValue(undefined);

            await deleteUser(validUserId);

            expect(db.delete).toHaveBeenCalled();
        });
    });

    describe('createUser', () => {
        const validUserData = {
            name: 'Jan Kowalski',
            email: 'jan@example.com',
            role: 'user',
        };

        it('powinien rzucić błąd dla zbyt krótkiej nazwy', async () => {
            const invalidData = {
                name: 'J', // za krótka (min 2)
                email: 'jan@example.com',
                role: 'user',
            };

            await expect(createUser(invalidData))
                .rejects.toThrow();
        });

        it('powinien rzucić błąd dla nieprawidłowego emaila', async () => {
            const invalidData = {
                name: 'Jan Kowalski',
                email: 'not-email',
                role: 'user',
            };

            await expect(createUser(invalidData))
                .rejects.toThrow();
        });

        it('powinien rzucić Unauthorized dla niezalogowanego', async () => {
            await expect(createUser(validUserData))
                .rejects.toThrow('Unauthorized');
        });

        it('powinien rzucić Forbidden dla nie-admina', async () => {
            mockNonAdmin();

            await expect(createUser(validUserData))
                .rejects.toThrow('Forbidden');
        });

        it('powinien rzucić błąd gdy użytkownik już istnieje', async () => {
            mockAdmin();
            // findFirst zwraca istniejącego użytkownika przy drugim wywołaniu
            (db.query.users.findFirst as any)
                .mockResolvedValueOnce({ role: 'admin' }) // checkAdmin
                .mockResolvedValueOnce({ id: 'existing-user' }); // sprawdzenie istnienia

            await expect(createUser(validUserData))
                .rejects.toThrow('Użytkownik z tym adresem email już istnieje');
        });

        it('powinien utworzyć użytkownika gdy dane poprawne i admin', async () => {
            mockAdmin();
            // Pierwszy findFirst dla checkAdmin, drugi dla sprawdzenia istnienia
            (db.query.users.findFirst as any)
                .mockResolvedValueOnce({ role: 'admin' })
                .mockResolvedValueOnce(null);

            await expect(createUser(validUserData))
                .resolves.not.toThrow();

            expect(db.insert).toHaveBeenCalled();
        });
    });

    describe('deleteUserData', () => {
        it('powinien rzucić Unauthorized dla niezalogowanego', async () => {
            await expect(deleteUserData(validUserId))
                .rejects.toThrow('Unauthorized');
        });

        it('powinien wywołać akcję gdy admin', async () => {
            mockAdmin();

            const result = await deleteUserData(validUserId);

            expect(result).toEqual({ success: true });
        });
    });

    describe('deleteUserHistory', () => {
        it('powinien rzucić Unauthorized dla niezalogowanego', async () => {
            await expect(deleteUserHistory(validUserId))
                .rejects.toThrow('Unauthorized');
        });

        it('powinien wywołać akcję gdy admin', async () => {
            mockAdmin();

            const result = await deleteUserHistory(validUserId);

            expect(result).toEqual({ success: true });
        });
    });

    describe('resetUserProgress', () => {
        it('powinien rzucić Unauthorized dla niezalogowanego', async () => {
            await expect(resetUserProgress(validUserId))
                .rejects.toThrow('Unauthorized');
        });

        it('powinien wywołać akcję gdy admin', async () => {
            mockAdmin();

            const result = await resetUserProgress(validUserId);

            expect(result).toEqual({ success: true });
        });
    });
});
