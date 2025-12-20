import { db } from '../lib/db/drizzle';
import { words } from '../lib/db/schema';
import { sql } from 'drizzle-orm';

async function checkCategories() {
    console.log('Sprawdzam kategorie słówek w bazie...\n');

    // Pobierz wszystkie unikalne kategorie
    const categories = await db
        .select({ category: words.category, count: sql<number>`count(*)::int` })
        .from(words)
        .groupBy(words.category)
        .orderBy(words.category);

    console.log('Kategorie w bazie:');
    console.log('==================');

    categories.forEach(({ category, count }) => {
        console.log(`${category}: ${count} słówek`);
    });

    // Pokaż słówka z kategorii "general" lub "General"
    console.log('\n\nSłówka w kategorii "general" lub "General":');
    console.log('===========================================');

    const generalWords = await db
        .select()
        .from(words)
        .where(sql`LOWER(${words.category}) = 'general'`)
        .orderBy(words.level, words.english);

    if (generalWords.length > 0) {
        generalWords.forEach(word => {
            console.log(`[${word.level}] ${word.english} - ${word.polish} (kategoria: ${word.category})`);
        });
    } else {
        console.log('Brak słówek w kategorii "general"');
    }

    process.exit(0);
}

checkCategories().catch(console.error);
