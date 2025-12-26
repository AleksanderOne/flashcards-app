/**
 * Testy dla akcji challenge (challenge-actions.ts)
 * 
 * Testuje:
 * - Pobieranie nauczonych słówek do wyzwania
 * - Integracja z systemowym i prywatnym słownictwem
 * - Deduplikacja wyników
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getLearnedWordsForChallenge, type ChallengeWord } from './challenge-actions';

// Mockowanie zależności
vi.mock('@/lib/auth', () => ({
    auth: vi.fn(),
}));

vi.mock('@/lib/db/drizzle', () => {
    const mockChain = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        then: vi.fn(),
    };

    return {
        db: {
            select: vi.fn().mockReturnValue(mockChain),
        },
    };
});

import { auth } from '@/lib/auth';
import { db } from '@/lib/db/drizzle';

describe('Challenge Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getLearnedWordsForChallenge', () => {
        it('powinien zwrócić pustą tablicę gdy brak sesji', async () => {
            (auth as any).mockResolvedValue(null);

            const result = await getLearnedWordsForChallenge();

            expect(result).toEqual([]);
        });

        it('powinien zwrócić pustą tablicę gdy brak user.id', async () => {
            (auth as any).mockResolvedValue({ user: {} });

            const result = await getLearnedWordsForChallenge();

            expect(result).toEqual([]);
        });

        it('powinien zwrócić słówka dla zalogowanego użytkownika', async () => {
            (auth as any).mockResolvedValue({
                user: { id: 'user-123' }
            });

            // Mockowanie dwóch zapytań: systemowych i prywatnych słówek
            const mockSystemWords = [
                { english: 'apple', polish: 'jabłko' },
                { english: 'banana', polish: 'banan' },
            ];
            const mockCustomWords = [
                { english: 'cat', polish: 'kot' },
            ];

            // Symulacja Promise dla łańcucha zapytań
            let callCount = 0;
            (db.select as any).mockImplementation(() => ({
                from: vi.fn().mockReturnValue({
                    innerJoin: vi.fn().mockReturnValue({
                        where: vi.fn().mockImplementation(() => {
                            callCount++;
                            return Promise.resolve(
                                callCount === 1 ? mockSystemWords : mockCustomWords
                            );
                        }),
                    }),
                }),
            }));

            const result = await getLearnedWordsForChallenge();

            expect(result).toHaveLength(3);
            expect(result).toContainEqual({ english: 'apple', polish: 'jabłko' });
            expect(result).toContainEqual({ english: 'banana', polish: 'banan' });
            expect(result).toContainEqual({ english: 'cat', polish: 'kot' });
        });

        it('powinien usuwać duplikaty słówek', async () => {
            (auth as any).mockResolvedValue({
                user: { id: 'user-123' }
            });

            // Słówko "apple" pojawia się w obu źródłach
            const mockSystemWords = [
                { english: 'apple', polish: 'jabłko' },
            ];
            const mockCustomWords = [
                { english: 'apple', polish: 'jabłko (prywatne)' }, // Duplikat
            ];

            let callCount = 0;
            (db.select as any).mockImplementation(() => ({
                from: vi.fn().mockReturnValue({
                    innerJoin: vi.fn().mockReturnValue({
                        where: vi.fn().mockImplementation(() => {
                            callCount++;
                            return Promise.resolve(
                                callCount === 1 ? mockSystemWords : mockCustomWords
                            );
                        }),
                    }),
                }),
            }));

            const result = await getLearnedWordsForChallenge();

            // Powinien być tylko jeden wpis dla "apple" (pierwszy znaleziony)
            const appleEntries = result.filter(w => w.english === 'apple');
            expect(appleEntries).toHaveLength(1);
            expect(appleEntries[0].polish).toBe('jabłko'); // Pierwszy (systemowy)
        });

        it('powinien zwrócić pustą tablicę gdy brak nauczonych słówek', async () => {
            (auth as any).mockResolvedValue({
                user: { id: 'user-123' }
            });

            (db.select as any).mockImplementation(() => ({
                from: vi.fn().mockReturnValue({
                    innerJoin: vi.fn().mockReturnValue({
                        where: vi.fn().mockResolvedValue([]),
                    }),
                }),
            }));

            const result = await getLearnedWordsForChallenge();

            expect(result).toEqual([]);
        });
    });
});
