'use server';

import { db } from '@/lib/db/drizzle';
import { words } from '@/lib/db/schema';
import { sql, eq } from 'drizzle-orm';
import { WORD_DATABASE } from '@/data/seed-data';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

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

export async function fixWordCategories() {
    // Sprawdź czy user jest adminem
    const session = await auth();
    if (!session || !session.user || session.user.role !== 'admin') {
        throw new Error('Unauthorized - admin only');
    }

    try {
        // 1. Pobierz statystyki przed
        const statsBefore = await db
            .select({
                category: words.category,
                count: sql<number>`count(*)::int`
            })
            .from(words)
            .groupBy(words.category)
            .orderBy(words.category);

        // 2. Pobierz wszystkie słówka z kategorii "General" (case-insensitive)
        const generalWords = await db
            .select()
            .from(words)
            .where(sql`LOWER(${words.category}) = 'general'`);

        if (generalWords.length === 0) {
            return {
                success: true,
                message: 'Nie znaleziono słówek w kategorii "General"',
                fixed: 0,
                notFound: 0,
                statsBefore,
                statsAfter: statsBefore
            };
        }

        // 3. Przygotuj mapowanie
        const categoryMap = buildCategoryMap();

        let fixed = 0;
        let notFound = 0;
        const notFoundWords: string[] = [];
        const fixedWords: Array<{ english: string, category: string, level: string }> = [];

        // 4. Popraw kategorie
        for (const word of generalWords) {
            const englishLower = word.english.toLowerCase();
            const mapping = categoryMap.get(englishLower);

            if (mapping) {
                await db
                    .update(words)
                    .set({
                        category: mapping.category,
                        level: mapping.level as any
                    })
                    .where(eq(words.id, word.id));

                fixedWords.push({
                    english: word.english,
                    category: mapping.category,
                    level: mapping.level
                });
                fixed++;
            } else {
                notFoundWords.push(word.english);
                notFound++;
            }
        }

        // 5. Pobierz statystyki po
        const statsAfter = await db
            .select({
                category: words.category,
                count: sql<number>`count(*)::int`
            })
            .from(words)
            .groupBy(words.category)
            .orderBy(words.category);

        // Revalidate
        revalidatePath('/all-words');
        revalidatePath('/admin');

        return {
            success: true,
            message: `Naprawiono ${fixed} słówek, ${notFound} nie znaleziono w WORD_DATABASE`,
            fixed,
            notFound,
            fixedWords: fixedWords.slice(0, 50), // Zwróć tylko pierwsze 50 dla UI
            notFoundWords: notFoundWords.slice(0, 50),
            statsBefore,
            statsAfter
        };

    } catch (error) {
        console.error('Błąd podczas naprawiania kategorii:', error);
        throw error;
    }
}
