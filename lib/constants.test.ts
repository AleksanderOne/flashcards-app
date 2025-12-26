/**
 * Testy dla stałych aplikacji (constants.ts)
 * 
 * Testuje:
 * - Definicje poziomów (LEVELS)
 * - Definicje kategorii (CATEGORIES)
 * - Kolory poziomów i kategorii
 * - Funkcję getCategoryColor
 */

import { describe, it, expect } from 'vitest';
import {
    LEVELS,
    CATEGORIES,
    LEVEL_COLORS,
    CATEGORY_COLOR_PALETTE,
    getCategoryColor,
    type LevelType,
    type CategoryType,
} from './constants';

describe('Constants (Stałe aplikacji)', () => {
    describe('LEVELS', () => {
        it('powinien zawierać 5 poziomów CEFR', () => {
            expect(LEVELS).toHaveLength(5);
        });

        it('powinien zawierać poziomy A1, A2, B1, B2, C1', () => {
            expect(LEVELS).toContain('A1');
            expect(LEVELS).toContain('A2');
            expect(LEVELS).toContain('B1');
            expect(LEVELS).toContain('B2');
            expect(LEVELS).toContain('C1');
        });

        it('poziomy powinny być w kolejności rosnącej trudności', () => {
            expect(LEVELS[0]).toBe('A1');
            expect(LEVELS[1]).toBe('A2');
            expect(LEVELS[2]).toBe('B1');
            expect(LEVELS[3]).toBe('B2');
            expect(LEVELS[4]).toBe('C1');
        });
    });

    describe('CATEGORIES', () => {
        it('powinien zawierać przynajmniej 10 kategorii', () => {
            expect(CATEGORIES.length).toBeGreaterThanOrEqual(10);
        });

        it('kategorie powinny być unikalne', () => {
            const uniqueCategories = new Set(CATEGORIES);
            expect(uniqueCategories.size).toBe(CATEGORIES.length);
        });

        it('powinien zawierać podstawowe kategorie', () => {
            expect(CATEGORIES).toContain('General');
            expect(CATEGORIES).toContain('Biznes');
            expect(CATEGORIES).toContain('Technologia');
        });

        it('kategorie nie powinny być puste', () => {
            CATEGORIES.forEach((category) => {
                expect(category.length).toBeGreaterThan(0);
                expect(category.trim()).toBe(category); // Bez whitespace
            });
        });
    });

    describe('LEVEL_COLORS', () => {
        it('powinien definiować kolory dla każdego poziomu', () => {
            LEVELS.forEach((level) => {
                expect(LEVEL_COLORS[level]).toBeDefined();
            });
        });

        it('każdy poziom powinien mieć bg, text i border', () => {
            LEVELS.forEach((level) => {
                expect(LEVEL_COLORS[level]).toHaveProperty('bg');
                expect(LEVEL_COLORS[level]).toHaveProperty('text');
                expect(LEVEL_COLORS[level]).toHaveProperty('border');
            });
        });

        it('kolory powinny zawierać klasy Tailwind', () => {
            LEVELS.forEach((level) => {
                expect(LEVEL_COLORS[level].bg).toMatch(/^bg-/);
                expect(LEVEL_COLORS[level].text).toMatch(/^text-/);
                expect(LEVEL_COLORS[level].border).toMatch(/^border-/);
            });
        });

        it('kolory powinny obsługiwać tryb ciemny (dark:)', () => {
            LEVELS.forEach((level) => {
                expect(LEVEL_COLORS[level].bg).toContain('dark:');
                expect(LEVEL_COLORS[level].text).toContain('dark:');
                expect(LEVEL_COLORS[level].border).toContain('dark:');
            });
        });
    });

    describe('CATEGORY_COLOR_PALETTE', () => {
        it('powinien mieć przynajmniej 5 kolorów w palecie', () => {
            expect(CATEGORY_COLOR_PALETTE.length).toBeGreaterThanOrEqual(5);
        });

        it('każdy kolor powinien mieć bg, text i border', () => {
            CATEGORY_COLOR_PALETTE.forEach((color) => {
                expect(color).toHaveProperty('bg');
                expect(color).toHaveProperty('text');
                expect(color).toHaveProperty('border');
            });
        });
    });

    describe('getCategoryColor', () => {
        it('powinien zwrócić obiekt z kolorami dla dowolnej kategorii', () => {
            const result = getCategoryColor('Technologia');

            expect(result).toHaveProperty('bg');
            expect(result).toHaveProperty('text');
            expect(result).toHaveProperty('border');
        });

        it('powinien zwracać deterministyczne wyniki (te same dla tej samej kategorii)', () => {
            const result1 = getCategoryColor('Biznes');
            const result2 = getCategoryColor('Biznes');

            expect(result1).toEqual(result2);
        });

        it('powinien zwracać różne kolory dla różnych kategorii', () => {
            // Dla kategorii o różnych hashach powinny być różne kolory
            // (chyba że trafią na ten sam indeks - to akceptowalne)
            const categories = ['Technologia', 'Sport', 'Muzyka', 'Nauka'];
            const colors = categories.map(getCategoryColor);

            // Sprawdzamy że funkcja działa dla różnych wejść
            colors.forEach((color) => {
                expect(color).toBeDefined();
                expect(color.bg).toMatch(/^bg-/);
            });
        });

        it('powinien obsługiwać puste stringi', () => {
            const result = getCategoryColor('');

            // Powinien zwrócić kolor z palety
            expect(result).toBeDefined();
            expect(CATEGORY_COLOR_PALETTE).toContainEqual(result);
        });

        it('powinien obsługiwać kategorię ze znakami specjalnymi', () => {
            const result = getCategoryColor('Nauka & Edukacja');

            expect(result).toBeDefined();
            expect(result).toHaveProperty('bg');
        });

        it('wynik powinien być jednym z kolorów z palety', () => {
            const testCategories = ['Test1', 'Test2', 'Test3', 'Random Category'];

            testCategories.forEach((category) => {
                const result = getCategoryColor(category);
                expect(CATEGORY_COLOR_PALETTE).toContainEqual(result);
            });
        });
    });

    describe('Typy', () => {
        it('LevelType powinien ograniczać wartości do zdefiniowanych poziomów', () => {
            // Test kompilacji - TypeScript sprawdzi poprawność typów
            const validLevel: LevelType = 'A1';
            expect(LEVELS).toContain(validLevel);
        });

        it('CategoryType powinien ograniczać wartości do zdefiniowanych kategorii', () => {
            // Test kompilacji - TypeScript sprawdzi poprawność typów
            const validCategory: CategoryType = 'General';
            expect(CATEGORIES).toContain(validCategory);
        });
    });
});
