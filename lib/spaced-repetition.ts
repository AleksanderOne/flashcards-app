/**
 * Implementacja algorytmu SuperMemo-2 (SM-2)
 *
 * Wejście:
 * - quality: Ocena jakości odpowiedzi (0-5)
 *   5 - idealna odpowiedź
 *   4 - poprawna odpowiedź po wahaniu
 *   3 - poprawna odpowiedź z trudnościami
 *   2 - niepoprawna odpowiedź; poprawna wydawała się łatwa do przypomnienia
 *   1 - niepoprawna odpowiedź; poprawna przypomniana
 *   0 - kompletna pustka w głowie
 * - repetitions: Poprzednia liczba powtórzeń (n)
 * - easiness: Poprzedni współczynnik łatwości (EF)
 * - interval: Poprzedni interwał w dniach (I)
 *
 * Wyjście:
 * - repetitions: Nowa liczba powtórzeń
 * - easiness: Nowy współczynnik łatwości
 * - interval: Nowy interwał w dniach
 */

export interface SM2Input {
    quality: number;
    repetitions: number;
    easiness: number;
    interval: number;
}

export interface SM2Output {
    repetitions: number;
    easiness: number;
    interval: number;
}

export function calculateSM2(input: SM2Input): SM2Output {
    let { quality, repetitions, easiness, interval } = input;

    // Walidacja: ograniczenie quality do zakresu 0-5
    quality = Math.max(0, Math.min(5, Math.round(quality)));

    // 1. Aktualizacja współczynnika łatwości (EF)
    // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    // EF nie może spaść poniżej 1.3
    let newEasiness = easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (newEasiness < 1.3) {
        newEasiness = 1.3;
    }

    // 2. Aktualizacja liczby powtórzeń i interwału
    let newRepetitions = repetitions;
    let newInterval = interval;

    if (quality >= 3) {
        // Poprawna odpowiedź
        if (repetitions === 0) {
            newInterval = 1;
        } else if (repetitions === 1) {
            newInterval = 6;
        } else {
            newInterval = Math.round(interval * newEasiness);
        }
        newRepetitions += 1;
    } else {
        // Błędna odpowiedź
        newRepetitions = 0;
        newInterval = 1;
    }

    return {
        repetitions: newRepetitions,
        easiness: parseFloat(newEasiness.toFixed(2)),
        interval: newInterval
    };
}

/**
 * Konwertuje prosty wynik (poprawne/niepoprawne) na jakość SM-2 (0-5)
 * @param isCorrect czy odpowiedź była poprawna
 * @param timeSpentMs czas spędzony na odpowiedzi (opcjonalny)
 */
export function getQualityFromBoolean(isCorrect: boolean, timeSpentMs?: number): number {
    if (!isCorrect) return 1; // Incorrect but familiar (assuming they are learning)

    // Jeśli odpowiedział poprawnie:
    // < 2s: Idealnie (5)
    // < 5s: Dobrze (4)
    // > 5s: Z trudem (3)
    if (timeSpentMs) {
        if (timeSpentMs < 2000) return 5;
        if (timeSpentMs < 5000) return 4;
        return 3;
    }

    return 4; // Default correct
}
