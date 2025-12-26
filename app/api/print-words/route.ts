import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/drizzle';
import { words, wordProgress, learningSessions } from '@/lib/db/schema';
import { eq, and, gte, lte, inArray, desc } from 'drizzle-orm';
import { LevelType } from '@/lib/constants';

export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const searchParams = request.nextUrl.searchParams;

    // Pobranie parametrów filtrowania z adresu URL
    const filterType = searchParams.get('filterType'); // 'all', 'learning', 'difficult', 'custom', 'period'
    const selectedIds = searchParams.get('selectedIds')?.split(',').filter(Boolean) || [];
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const categories = searchParams.get('categories')?.split(',').filter(Boolean) || [];
    const levels = searchParams.get('levels')?.split(',').filter(Boolean) || [];

    try {
        let result: unknown[] = [];

        if (filterType === 'learning') {
            // Filtrowanie słówek w trakcie nauki (posiadających wpis w wordProgress)
            // Używamy JOIN dla wydajności zamiast pobierania osobno i mapowania w JS
            const queryResult = await db
                .select({
                    word: words,
                    progress: wordProgress,
                })
                .from(words)
                .innerJoin(wordProgress, eq(words.english, wordProgress.wordEnglish))
                .where(eq(wordProgress.userId, userId));

            result = queryResult.map(({ word, progress }) => ({
                ...word,
                progress,
            }));

        } else if (filterType === 'difficult') {
            // Filtrowanie trudnych słówek (ocena trudności >= 3)
            const queryResult = await db
                .select({
                    word: words,
                    progress: wordProgress,
                })
                .from(words)
                .innerJoin(wordProgress, eq(words.english, wordProgress.wordEnglish))
                .where(
                    and(
                        eq(wordProgress.userId, userId),
                        gte(wordProgress.difficultyRating, 3)
                    )
                )
                .orderBy(desc(wordProgress.difficultyRating));

            result = queryResult.map(({ word, progress }) => ({
                ...word,
                progress,
            }));

        } else if (filterType === 'period' && dateFrom && dateTo) {
            // Filtrowanie słówek, które były ćwiczone w zadanym zakresie dat
            const fromDate = new Date(dateFrom);
            const toDate = new Date(dateTo);
            toDate.setHours(23, 59, 59, 999); // Koniec dnia

            // Tutaj musimy najpierw znaleźć unikalne słówka z sesji, 
            // a potem pobrać ich definicje z tabeli words.
            // Możemy użyć podzapytania lub JOIN, ale distinct on wordEnglish z sesji jest tu kluczowe.

            const sessionsInPeriod = await db
                .selectDistinct({
                    wordEnglish: learningSessions.wordEnglish,
                })
                .from(learningSessions)
                .where(
                    and(
                        eq(learningSessions.userId, userId),
                        gte(learningSessions.createdAt, fromDate),
                        lte(learningSessions.createdAt, toDate)
                    )
                );

            const uniqueWordEnglish = sessionsInPeriod.map((s) => s.wordEnglish);

            if (uniqueWordEnglish.length === 0) {
                result = [];
            } else {
                result = await db
                    .select()
                    .from(words)
                    .where(inArray(words.english, uniqueWordEnglish));
            }

        } else if (filterType === 'custom' && selectedIds.length > 0) {
            // Pobranie słówek na podstawie listy wybranych ID
            result = await db
                .select()
                .from(words)
                .where(inArray(words.id, selectedIds));

        } else {
            // Pobranie wszystkich słówek z uwzględnieniem filtrów kategorii i poziomu (przypadek domyślny)
            const conditions = [];

            if (categories.length > 0) {
                conditions.push(inArray(words.category, categories));
            }

            if (levels.length > 0) {
                // Rzutowanie na any/LevelType[] jest potrzebne, ponieważ levels z URL to string[]
                // a Drizzle oczekuje dokładnych wartości enuma
                conditions.push(inArray(words.level, levels as LevelType[]));
            }

            if (conditions.length > 0) {
                result = await db
                    .select()
                    .from(words)
                    .where(and(...conditions));
            } else {
                result = await db.select().from(words);
            }
        }

        return NextResponse.json(result);

    } catch (error) {
        console.error('Błąd podczas pobierania słówek do druku:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
