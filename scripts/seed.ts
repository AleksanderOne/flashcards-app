import { WORD_DATABASE, TRANSLATIONS } from '../data/seed-data';
import { config } from 'dotenv';

// Wczytanie zmiennych środowiskowych *przed* importem bazy danych
config({ path: '.env.local' });

async function main() {
    // Dynamic import po załadowaniu zmiennych
    const { db } = await import('../lib/db/drizzle');
    const { words } = await import('../lib/db/schema');

    console.log('🌱 Rozpoczynanie seedowania...');

    try {
        // Czyszczenie istniejących słówek (opcjonalne - ostrożnie na produkcji!)
        // await db.delete(words);

        let totalAdded = 0;

        for (const [level, categories] of Object.entries(WORD_DATABASE)) {
            console.log(`Przetwarzanie poziomu ${level}...`);

            for (const [category, englishWords] of Object.entries(categories)) {
                console.log(`  Przetwarzanie kategorii ${category}...`);

                for (const englishWord of englishWords) {
                    const polishTranslation = TRANSLATIONS[englishWord];

                    if (!polishTranslation) {
                        console.warn(`    ⚠️ Brak tłumaczenia dla: ${englishWord}`);
                        continue;
                    }

                    // Sprawdź duplikaty zanim dodasz
                    // W prawdziwym seedzie masowym lepiej użyć ON CONFLICT DO NOTHING
                    // ale drizzle ma ograniczone wsparcie w basic insertach, więc prosto:

                    /* 
                       UWAGA: Dla zwiększenia wydajności można by użyć insertMany, 
                       ale pętla jest prostsza i bezpieczniejsza dla obecnych potrzeb.
                    */

                    await db.insert(words).values({
                        english: englishWord,
                        polish: polishTranslation,
                        level: level as 'A1' | 'A2' | 'B1' | 'B2' | 'C1',
                        category: category,
                        createdAt: new Date(),
                    });

                    totalAdded++;
                }
            }
        }

        console.log(`✅ Seedowanie zakończone! Dodano ${totalAdded} słówek.`);
    } catch (error) {
        console.error('❌ Błąd seedowania:', error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

main();
