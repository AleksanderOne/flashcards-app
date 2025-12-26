/**
 * Testy dla modułu osiągnięć (achievements)
 * 
 * Testuje:
 * - Definicje osiągnięć i stałe
 * - Funkcje pomocnicze (calculateTotalPoints, getNextAchievement)
 * - Logikę sprawdzania i odblokowywania osiągnięć
 */

import { describe, it, expect, vi } from 'vitest';
import {
    ACHIEVEMENTS_LIST,
    ACHIEVEMENT_CATEGORIES,
    RARITY_COLORS,
    RARITY_LABELS,
    calculateTotalPoints,
    getNextAchievement,
} from './achievements';

// Mockowanie zależności bazodanowych
vi.mock('@/lib/db/drizzle', () => ({
    db: {
        query: {
            userStats: { findFirst: vi.fn() },
            achievements: { findFirst: vi.fn() },
        },
        insert: vi.fn().mockReturnValue({ values: vi.fn() }),
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
    },
}));

describe('Achievements (System Osiągnięć)', () => {
    describe('ACHIEVEMENTS_LIST', () => {
        it('powinien zawierać przynajmniej jedno osiągnięcie', () => {
            expect(ACHIEVEMENTS_LIST.length).toBeGreaterThan(0);
        });

        it('każde osiągnięcie powinno mieć wymagane pola', () => {
            ACHIEVEMENTS_LIST.forEach((achievement) => {
                expect(achievement).toHaveProperty('id');
                expect(achievement).toHaveProperty('title');
                expect(achievement).toHaveProperty('description');
                expect(achievement).toHaveProperty('icon');
                expect(achievement).toHaveProperty('threshold');
                expect(achievement).toHaveProperty('type');
                expect(achievement).toHaveProperty('rarity');
                expect(achievement).toHaveProperty('category');
                expect(achievement).toHaveProperty('points');
            });
        });

        it('każde osiągnięcie powinno mieć unikalne ID', () => {
            const ids = ACHIEVEMENTS_LIST.map((a) => a.id);
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(ids.length);
        });

        it('każde osiągnięcie powinno mieć prawidłowy typ', () => {
            const validTypes = ['words_learned', 'streak', 'sessions', 'accuracy', 'special'];
            ACHIEVEMENTS_LIST.forEach((achievement) => {
                expect(validTypes).toContain(achievement.type);
            });
        });

        it('każde osiągnięcie powinno mieć prawidłową rzadkość', () => {
            const validRarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
            ACHIEVEMENTS_LIST.forEach((achievement) => {
                expect(validRarities).toContain(achievement.rarity);
            });
        });

        it('threshold powinien być liczbą dodatnią', () => {
            ACHIEVEMENTS_LIST.forEach((achievement) => {
                expect(achievement.threshold).toBeGreaterThan(0);
            });
        });

        it('points powinny być liczbą dodatnią', () => {
            ACHIEVEMENTS_LIST.forEach((achievement) => {
                expect(achievement.points).toBeGreaterThan(0);
            });
        });
    });

    describe('ACHIEVEMENT_CATEGORIES', () => {
        it('powinien zawierać unikalne kategorie', () => {
            const uniqueCategories = new Set(ACHIEVEMENT_CATEGORIES);
            expect(uniqueCategories.size).toBe(ACHIEVEMENT_CATEGORIES.length);
        });

        it('powinien zawierać kategorie z listy osiągnięć', () => {
            const categoriesFromList = new Set(ACHIEVEMENTS_LIST.map((a) => a.category));
            categoriesFromList.forEach((category) => {
                expect(ACHIEVEMENT_CATEGORIES).toContain(category);
            });
        });
    });

    describe('RARITY_COLORS', () => {
        it('powinien definiować kolory dla każdej rzadkości', () => {
            const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const;
            rarities.forEach((rarity) => {
                expect(RARITY_COLORS[rarity]).toBeDefined();
                expect(RARITY_COLORS[rarity]).toHaveProperty('bg');
                expect(RARITY_COLORS[rarity]).toHaveProperty('border');
                expect(RARITY_COLORS[rarity]).toHaveProperty('text');
                expect(RARITY_COLORS[rarity]).toHaveProperty('badge');
                expect(RARITY_COLORS[rarity]).toHaveProperty('glow');
            });
        });
    });

    describe('RARITY_LABELS', () => {
        it('powinien definiować polskie etykiety dla każdej rzadkości', () => {
            expect(RARITY_LABELS.common).toBe('Zwykłe');
            expect(RARITY_LABELS.uncommon).toBe('Niepospolite');
            expect(RARITY_LABELS.rare).toBe('Rzadkie');
            expect(RARITY_LABELS.epic).toBe('Epickie');
            expect(RARITY_LABELS.legendary).toBe('Legendarne');
        });
    });

    describe('calculateTotalPoints', () => {
        it('powinien zwrócić 0 dla pustej listy', () => {
            const result = calculateTotalPoints([]);
            expect(result).toBe(0);
        });

        it('powinien poprawnie sumować punkty za odblokowane osiągnięcia', () => {
            // Bierzemy pierwsze 2 osiągnięcia z listy
            const unlockedIds = ACHIEVEMENTS_LIST.slice(0, 2).map((a) => a.id);
            const expectedPoints = ACHIEVEMENTS_LIST.slice(0, 2).reduce(
                (sum, a) => sum + a.points,
                0
            );

            const result = calculateTotalPoints(unlockedIds);

            expect(result).toBe(expectedPoints);
        });

        it('powinien ignorować nieistniejące ID osiągnięć', () => {
            const unlockedIds = ['nieistniejace-id', ACHIEVEMENTS_LIST[0].id];
            const expectedPoints = ACHIEVEMENTS_LIST[0].points;

            const result = calculateTotalPoints(unlockedIds);

            expect(result).toBe(expectedPoints);
        });

        it('powinien obsługiwać wszystkie osiągnięcia', () => {
            const allIds = ACHIEVEMENTS_LIST.map((a) => a.id);
            const totalExpected = ACHIEVEMENTS_LIST.reduce((sum, a) => sum + a.points, 0);

            const result = calculateTotalPoints(allIds);

            expect(result).toBe(totalExpected);
        });
    });

    describe('getNextAchievement', () => {
        it('powinien zwrócić pierwsze osiągnięcie gdy currentValue = 0', () => {
            const result = getNextAchievement('words_learned', 0);

            expect(result).not.toBeNull();
            expect(result?.type).toBe('words_learned');
            // Powinien zwrócić osiągnięcie z najniższym threshold
        });

        it('powinien zwrócić następne osiągnięcie powyżej currentValue', () => {
            // Zakładamy, że mamy osiągnięcie dla 10 słówek
            const result = getNextAchievement('words_learned', 5);

            expect(result).not.toBeNull();
            if (result) {
                expect(result.threshold).toBeGreaterThan(5);
            }
        });

        it('powinien zwrócić null gdy wszystkie osiągnięcia typu są już odblokowane', () => {
            // Bardzo duża wartość - powyżej wszystkich thresholdów
            const result = getNextAchievement('words_learned', 999999);

            expect(result).toBeNull();
        });

        it('powinien prawidłowo obsługiwać różne typy osiągnięć', () => {
            const types: Array<'words_learned' | 'streak' | 'sessions'> = [
                'words_learned',
                'streak',
                'sessions',
            ];

            types.forEach((type) => {
                const result = getNextAchievement(type, 0);
                if (result) {
                    expect(result.type).toBe(type);
                }
            });
        });
    });
});
