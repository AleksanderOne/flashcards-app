import * as dotenv from 'dotenv';
import * as path from 'path';

// Załaduj .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
import { db } from '../lib/db/drizzle';
import { words } from '../lib/db/schema';
import { sql, eq } from 'drizzle-orm';
import { WORD_DATABASE } from '../data/seed-data';
import { LevelType } from '../lib/constants';

// Mapowanie słówek do kategorii na podstawie WORD_DATABASE
function buildCategoryMap() {
    const categoryMap = new Map<string, { category: string, level: string }>();

    for (const [level, categories] of Object.entries(WORD_DATABASE)) {
        for (const [category, wordsList] of Object.entries(categories)) {
            wordsList.forEach(word => {
                categoryMap.set(word.toLowerCase(), { category, level });
            });
        }
    }

    return categoryMap;
}

async function fixCategories() {
    console.log('🔍 Sprawdzam kategorie słówek w bazie...\n');

    // 1. Pokaż obecny stan
    const categoriesStats = await db
        .select({
            category: words.category,
            count: sql<number>`count(*)::int`
        })
        .from(words)
        .groupBy(words.category)
        .orderBy(words.category);

    console.log('📊 Obecny stan kategorii:');
    console.log('========================');
    categoriesStats.forEach(({ category, count }) => {
        console.log(`  ${category}: ${count} słówek`);
    });
    console.log('');

    // 2. Pobranie wszystkich słówek z kategorii "General" (bez uwzględniania wielkości liter)
    const generalWords = await db
        .select()
        .from(words)
        .where(sql`LOWER(${words.category}) = 'general'`);

    if (generalWords.length === 0) {
        console.log('✅ Brak słówek w kategorii "General". Wszystko OK!');
        process.exit(0);
    }

    console.log(`⚠️  Znaleziono ${generalWords.length} słówek w kategorii "General"\n`);

    // 3. Przygotuj mapowanie
    const categoryMap = buildCategoryMap();

    let fixed = 0;
    let notFound = 0;
    const notFoundWords: string[] = [];

    // 4. Popraw kategorie
    console.log('🔧 Poprawiam kategorie...\n');

    for (const word of generalWords) {
        const englishLower = word.english.toLowerCase();
        const mapping = categoryMap.get(englishLower);

        if (mapping) {
            await db
                .update(words)
                .set({
                    category: mapping.category,
                    level: mapping.level as LevelType
                })
                .where(eq(words.id, word.id));

            console.log(`  ✓ ${word.english} → ${mapping.category} (${mapping.level})`);
            fixed++;
        } else {
            console.log(`  ✗ ${word.english} - nie znaleziono w WORD_DATABASE`);
            notFound++;
            notFoundWords.push(word.english);
        }
    }

    console.log('\n====================================');
    console.log(`✅ Poprawiono: ${fixed} słówek`);
    console.log(`❌ Nie znaleziono: ${notFound} słówek`);

    if (notFoundWords.length > 0) {
        console.log('\n📝 Słówka nie znalezione w WORD_DATABASE:');
        notFoundWords.forEach(w => console.log(`  - ${w}`));
    }

    // 5. Pokaż nowy stan
    const newStats = await db
        .select({
            category: words.category,
            count: sql<number>`count(*)::int`
        })
        .from(words)
        .groupBy(words.category)
        .orderBy(words.category);

    console.log('\n📊 Nowy stan kategorii:');
    console.log('======================');
    newStats.forEach(({ category, count }) => {
        console.log(`  ${category}: ${count} słówek`);
    });

    process.exit(0);
}

fixCategories().catch(error => {
    console.error('❌ Błąd:', error);
    process.exit(1);
});
