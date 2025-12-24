
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as actions from './words-actions';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/drizzle';

// Mock dependencies with factory to prevent loading actual modules
vi.mock('@/lib/auth', () => ({
    auth: vi.fn(),
}));
vi.mock('@/lib/db/drizzle');
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

// Helper do tworzenia łańcucha zapytań Drizzle
const createDbChain = (finalResult: any) => {
    const chain: any = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        then: (resolve: any) => resolve(finalResult), // Symulacja Promise
    };
    return chain;
};

describe('Words Actions (Server Actions)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('submitWordForApproval', () => {
        it('powinien zwrócić błąd jeśli użytkownik nie jest zalogowany', async () => {
            (auth as any).mockResolvedValue(null);

            const result = await actions.submitWordForApproval({
                english: 'apple',
                polish: 'jabłko',
                level: 'A1',
                category: 'Food'
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Musisz być zalogowany');
        });

        it('powinien zwrócić błąd jeśli słówko już istnieje', async () => {
            (auth as any).mockResolvedValue({ user: { id: 'user1', role: 'user' } });

            // Mock db.select()... to return existing word
            const dbChain = createDbChain([{ id: 'existing-id' }]);
            (db.select as any).mockReturnValue(dbChain);

            const result = await actions.submitWordForApproval({
                english: 'apple',
                polish: 'jabłko',
                level: 'A1',
                category: 'Food'
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('To słówko już istnieje w bazie');
        });

        it('powinien dodać słówko do bazy (oczekujące) dla zwykłego użytkownika', async () => {
            (auth as any).mockResolvedValue({ user: { id: 'user1', role: 'user' } });

            // Mock db.select check returns empty
            const selectChain = createDbChain([]);
            (db.select as any).mockReturnValue(selectChain);

            // Mock insert
            const insertChain = createDbChain(undefined);
            (db.insert as any).mockReturnValue(insertChain);

            const result = await actions.submitWordForApproval({
                english: 'new',
                polish: 'nowy',
                level: 'A1',
                category: 'General'
            });

            expect(result.success).toBe(true);
            // Verify db.insert was called twice (words and customWords)
            expect(db.insert).toHaveBeenCalledTimes(2);
        });

        it('powinien automatycznie zatwierdzić słówko dodane przez administratora', async () => {
            (auth as any).mockResolvedValue({ user: { id: 'admin1', role: 'admin' } });

            // Mock db.select check returns empty
            const selectChain = createDbChain([]);
            (db.select as any).mockReturnValue(selectChain);

            // Mock insert capture values
            const insertFn = vi.fn().mockReturnValue(createDbChain(undefined));
            (db.insert as any) = insertFn;

            const result = await actions.submitWordForApproval({
                english: 'admin word',
                polish: 'słowo admina',
                level: 'C1',
                category: 'Advanced'
            });

            expect(result.success).toBe(true);
            // Check first call (words table) values
            const firstCallValues = insertFn.mock.results[0].value.values.mock.calls[0][0];
            expect(firstCallValues.isApproved).toBe(true);
        });
    });

    describe('approveWord (Admin)', () => {
        // Prawidłowy UUID dla testów (walidacja Zod wymaga UUID)
        const validWordId = '550e8400-e29b-41d4-a716-446655440000';
        const invalidWordId = 'not-a-valid-uuid';

        it('powinien zablokować dostęp dla nie-admina', async () => {
            (auth as any).mockResolvedValue({ user: { id: 'user1', role: 'user' } }); // Role in session is user

            // Mock db check for user role fallback
            const dbChain = createDbChain([{ role: 'user' }]);
            (db.select as any).mockReturnValue(dbChain);

            const result = await actions.approveWord(validWordId);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Brak uprawnień');
        });

        it('powinien zatwierdzić słowo jeśli użytkownik jest adminem', async () => {
            (auth as any).mockResolvedValue({ user: { id: 'admin1', role: 'admin' } });

            const updateChain = createDbChain(undefined);
            (db.update as any).mockReturnValue(updateChain);

            const result = await actions.approveWord(validWordId);

            expect(result.success).toBe(true);
            expect(db.update).toHaveBeenCalled();
        });

        it('powinien zwrócić błąd dla nieprawidłowego UUID', async () => {
            (auth as any).mockResolvedValue({ user: { id: 'admin1', role: 'admin' } });

            const result = await actions.approveWord(invalidWordId);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Nieprawidłowy identyfikator słówka');
        });
    });
});
