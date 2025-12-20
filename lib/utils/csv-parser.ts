
import { LEVELS } from "@/lib/constants";

export interface ParsedWord {
    english: string;
    polish: string;
    level: string;
    category: string;
    isValid: boolean;
    error?: string;
}

export const parseWordsCSV = (content: string): ParsedWord[] => {
    const lines = content.split(/\r?\n/);
    const parsed: ParsedWord[] = [];

    // Pomiń nagłówek, jeśli występuje
    let startIndex = 0;
    if (lines.length > 0 &&
        lines[0].toLowerCase().includes('english') &&
        lines[0].toLowerCase().includes('polish')) {
        startIndex = 1;
    }

    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Obsługa CSV separowanego przecinkiem lub średnikiem
        const separator = line.includes(';') ? ';' : ',';
        const parts = line.split(separator).map(p => p.trim());

        if (parts.length >= 4) {
            const [english, polish, levelRaw, category] = parts;
            // Oczyszczanie danych wejściowych
            const level = levelRaw.toUpperCase();

            // Walidacja wiersza
            const isValidLevel = (LEVELS as readonly string[]).includes(level);
            const isValid = !!english && !!polish && isValidLevel && !!category;

            parsed.push({
                english,
                polish,
                level,
                category,
                isValid,
                error: !isValidLevel ? `Niepoprawny poziom: ${levelRaw}` : undefined
            });
        }
    }
    return parsed;
};
