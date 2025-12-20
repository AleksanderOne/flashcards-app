import { describe, it, expect } from 'vitest';
import { calculateSM2, getQualityFromBoolean } from './spaced-repetition';

describe('Spaced Repetition (Algorytm SM-2)', () => {
    describe('calculateSM2', () => {
        it('powinien poprawnie obsłużyć pierwsze powtórzenie (poprawna odpowiedź)', () => {
            const input = {
                quality: 5,
                repetitions: 0,
                easiness: 2.5,
                interval: 0,
            };

            const result = calculateSM2(input);

            expect(result.repetitions).toBe(1);
            expect(result.interval).toBe(1);
            expect(result.easiness).toBeGreaterThan(2.5); // 5 zwiększa łatwość
        });

        it('powinien poprawnie obsłużyć drugie powtórzenie (poprawna odpowiedź)', () => {
            const input = {
                quality: 4,
                repetitions: 1,
                easiness: 2.6,
                interval: 1,
            };

            const result = calculateSM2(input);

            expect(result.repetitions).toBe(2);
            expect(result.interval).toBe(6);
            expect(result.easiness).toBeCloseTo(2.6, 1); // Niewielka zmiana lub bez zmian
        });

        it('powinien zresetować powtórzenia i interwał przy błędnej odpowiedzi', () => {
            const input = {
                quality: 2,
                repetitions: 5,
                easiness: 2.8,
                interval: 20,
            };

            const result = calculateSM2(input);

            expect(result.repetitions).toBe(0);
            expect(result.interval).toBe(1);
            // Łatwość powinna spaść
            expect(result.easiness).toBeLessThan(2.8);
        });

        it('nie powinien pozwolić na spadek łatwości poniżej 1.3', () => {
            const input = {
                quality: 0,
                repetitions: 2,
                easiness: 1.35,
                interval: 5,
            };

            // Wielokrotne porażki, aby obniżyć wartość
            let currentResult = calculateSM2(input);
            // Hardcode sprawdzenie logiki, znając wzór:
            // EF' = EF + (0.1 - (5-q)*(0.08+(5-q)*0.02))
            // q=0 => 5* (0.08 + 0.1) = 5*0.18 = 0.9
            // zmiana = 0.1 - 0.9 = -0.8
            // 1.35 - 0.8 = 0.55 => powinno zostać ograniczone do 1.3

            expect(currentResult.easiness).toBe(1.3);
        });

        it('powinien obliczyć interwał na podstawie poprzedniego interwału i łatwości dla powtórzeń > 2', () => {
            const input = {
                quality: 4,
                repetitions: 2,
                easiness: 2.5,
                interval: 6,
            };

            const result = calculateSM2(input);

            expect(result.repetitions).toBe(3);
            // Nowy Interwał = I * EF = 6 * 2.5 = 15
            // Aktualizacja EF dla q=4: 0.1 - (1)*(0.08 + 0.02) = 0.1 - 0.1 = 0
            // Więc EF pozostaje 2.5
            expect(result.easiness).toBe(2.5);
            expect(result.interval).toBe(15);
        });
    });

    describe('getQualityFromBoolean', () => {
        it('powinien zwrócić 1 dla błędnej odpowiedzi', () => {
            expect(getQualityFromBoolean(false)).toBe(1);
        });

        it('powinien zwrócić 4 dla poprawnej odpowiedzi z nieznanym czasem', () => {
            expect(getQualityFromBoolean(true)).toBe(4);
        });

        it('powinien zwrócić 5 (idealnie) dla szybkiej poprawnej odpowiedzi (<2s)', () => {
            expect(getQualityFromBoolean(true, 1500)).toBe(5);
        });

        it('powinien zwrócić 4 (dobrze) dla średnio szybkiej poprawnej odpowiedzi (<5s)', () => {
            expect(getQualityFromBoolean(true, 3000)).toBe(4);
        });

        it('powinien zwrócić 3 (z trudem) dla wolnej poprawnej odpowiedzi (>5s)', () => {
            expect(getQualityFromBoolean(true, 6000)).toBe(3);
        });
    });
});
