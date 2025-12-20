import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { words } from '../lib/db/schema';
import { config } from 'dotenv';
import * as schema from '../lib/db/schema';

// Wczytywanie zmiennych środowiskowych z plików .env i .env.local
config({ path: '.env' });
config({ path: '.env.local', override: true });

const COMMON_WORDS_URL = 'https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-usa-no-swears.txt';
const DICT_URL = 'https://raw.githubusercontent.com/djstrong/PL-Wiktionary-To-Dictionary/master/dictionaries/english_polish.txt';

function determineLevel(rank: number): 'A1' | 'A2' | 'B1' | 'B2' | 'C1' {
    if (rank < 1000) return 'A1';
    if (rank < 3000) return 'A2';
    if (rank < 6000) return 'B1';
    if (rank < 9000) return 'B2';
    return 'C1';
}

async function importWords() {
    console.log('📥 Rozpoczynanie procesu importu słówek...');

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('❌ Nie znaleziono DATABASE_URL w .env lub .env.local');
        process.exit(1);
    }

    console.log(`   Docelowy host bazy danych: ${connectionString.split('@')[1]?.split(':')[0] || 'nieznany'}`);

    // Utworzenie klienta DB (lokalnie bez SSL, na produkcji z SSL)
    const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
    const client = postgres(connectionString, {
        prepare: false,
        ssl: isLocal ? false : 'require'
    });
    const db = drizzle(client, { schema });

    try {
        // 1. Pobieranie listy najczęstszych słów angielskich (ranking)
        console.log('   Pobieranie listy popularnych angielskich słówek...');
        const commonResponse = await fetch(COMMON_WORDS_URL);
        if (!commonResponse.ok) throw new Error(`Failed to fetch common words: ${commonResponse.statusText}`);
        const commonText = await commonResponse.text();
        const commonWords = commonText.split('\n').map(w => w.trim()).filter(w => w.length > 0);
        console.log(`   Znaleziono ${commonWords.length} popularnych słówek.`);

        // 2. Pobieranie słownika angielsko-polskiego
        console.log('   Pobieranie słownika angielsko-polskiego...');
        const dictResponse = await fetch(DICT_URL);
        if (!dictResponse.ok) throw new Error(`Failed to fetch dictionary: ${dictResponse.statusText}`);
        const dictText = await dictResponse.text();

        // Parsowanie słownika do Mapy
        console.log('   Parsowanie słownika...');
        const dictMap = new Map<string, string>();
        const lines = dictText.split('\n');
        for (const line of lines) {
            // Format: "word - translation"
            // Słownik może zawierać duplikaty oraz wiele znaczeń oddzielonych średnikiem.
            // Dla uproszczenia pobieramy pierwsze znaczenie przed średnikiem lub przecinkiem.
            const parts = line.split(' - ');
            if (parts.length >= 2) {
                const en = parts[0].trim().toLowerCase();
                const pl = parts.slice(1).join(' - ').trim();

                const simplePol = pl.split(';')[0].split(',')[0].trim();

                if (en && simplePol) {
                    dictMap.set(en, simplePol);
                }
            }
        }
        console.log(`   Rozmiar słownika: ${dictMap.size} wpisów.`);

        // 3. Sprawdzenie istniejących słówek w bazie, aby uniknąć duplikatów
        console.log('   Sprawdzanie istniejących słówek w bazie...');
        const existingWords = await db.select({ english: words.english }).from(words);
        const existingSet = new Set(existingWords.map(w => w.english.toLowerCase()));
        console.log(`   Znaleziono ${existingSet.size} istniejących słówek w bazie.`);

        // 4. Przygotowanie listy słówek do wstawienia
        const toInsert = [];
        let skippedCount = 0;
        let notFoundInDictCount = 0;

        for (let i = 0; i < commonWords.length; i++) {
            const englishWord = commonWords[i].toLowerCase();

            if (existingSet.has(englishWord)) {
                skippedCount++;
                continue;
            }

            const translation = dictMap.get(englishWord);
            if (!translation) {
                notFoundInDictCount++;
                continue;
            }

            const level = determineLevel(i);

            toInsert.push({
                english: englishWord,
                polish: translation,
                level: level,
                category: 'General',
                createdAt: new Date(),
            });
        }

        console.log(`   Przygotowano ${toInsert.length} nowych słówek do wstawienia.`);
        console.log(`   Pominięto (już w bazie): ${skippedCount}`);
        console.log(`   Pominięto (brak tłumaczenia): ${notFoundInDictCount}`);

        // 5. Wstawianie danych partiami (batch insert)
        if (toInsert.length > 0) {
            console.log('🚀 Wstawianie do bazy danych...');
            const BATCH_SIZE = 100;
            for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
                const batch = toInsert.slice(i, i + BATCH_SIZE);
                await db.insert(words).values(batch).onConflictDoNothing(); // Safety net

                const progress = Math.min((i + BATCH_SIZE), toInsert.length);
                process.stdout.write(`\r   Postęp: ${progress}/${toInsert.length}`);
            }
            console.log('\n✅ Import zakończony pomyślnie!');
        } else {
            console.log('✅ Baza danych jest już aktualna.');
        }

        // Zamknięcie połączenia
        await client.end();
        process.exit(0);

    } catch (error) {
        console.error('❌ Import nie powiódł się:', error);
        await client.end();
        process.exit(1);
    }
}

importWords();
