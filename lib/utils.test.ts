import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('Funkcje pomocnicze (utils)', () => {
    describe('cn (className merger)', () => {
        it('powinien poprawnie łączyć klasy', () => {
            const result = cn('class1', 'class2');
            expect(result).toBe('class1 class2');
        });

        it('powinien ignorować puste wartości i null/undefined', () => {
            const result = cn('part1', null, undefined, '', 'part2');
            expect(result).toBe('part1 part2');
        });

        it('powinien rozwiązywać konflikty klas Tailwind (nadpisywać)', () => {
            // Tailwind merge powinien zachować ostatnią pasującą klasę dla danej właściwości
            const result = cn('bg-red-500', 'bg-blue-500');
            expect(result).toBe('bg-blue-500');
        });

        it('powinien obsługiwać obiekty warunkowe', () => {
            const result = cn('base-class', {
                'active': true,
                'disabled': false
            });
            expect(result).toBe('base-class active');
        });
    });
});
