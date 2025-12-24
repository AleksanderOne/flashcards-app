import { db } from '@/lib/db/drizzle';
import { words, users } from '@/lib/db/schema';
import { ilike, or, and, eq, desc } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { LevelType, LEVELS } from '@/lib/constants';
import { auth } from '@/lib/auth';

const ITEMS_PER_PAGE = 20;

/**
 * Escapuje znaki specjalne w LIKE pattern (%, _, \) dla bezpieczeństwa.
 * Zapobiega SQL injection przez znaki specjalne w wyszukiwaniu.
 */
function escapeLikePattern(pattern: string): string {
    return pattern
        .replace(/\\/g, '\\\\')  // backslash musi być pierwszy
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_');
}

/**
 * Pobiera listę zatwierdzonych słówek z paginacją.
 * Wymaga zalogowania - tylko autoryzowani użytkownicy mają dostęp.
 */
export async function GET(request: NextRequest) {
    try {
        // Sprawdzenie autoryzacji - wymagana aktywna sesja
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'Wymagane zalogowanie' },
                { status: 401 }
            );
        }

        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get('query') || '';
        const category = searchParams.get('category') || 'all';
        const level = searchParams.get('level') || 'all';
        const page = Number(searchParams.get('page')) || 1;
        const offset = (page - 1) * ITEMS_PER_PAGE;

        // Budowanie filtrów zapytania
        const filters = [];

        if (query) {
            // Sanityzacja znaków specjalnych LIKE dla bezpieczeństwa
            const sanitizedQuery = escapeLikePattern(query);
            filters.push(or(
                ilike(words.english, `%${sanitizedQuery}%`),
                ilike(words.polish, `%${sanitizedQuery}%`)
            ));
        }

        if (category && category !== 'all') {
            filters.push(eq(words.category, category));
        }

        if (level && level !== 'all' && LEVELS.includes(level as LevelType)) {
            filters.push(eq(words.level, level as LevelType));
        }

        // Uwzględnienie tylko zatwierdzonych słówek
        filters.push(eq(words.isApproved, true));

        const whereClause = filters.length > 0 ? and(...filters) : undefined;

        // Pobranie listy słówek z paginacją oraz danymi autora
        const wordsList = await db.select({
            id: words.id,
            english: words.english,
            polish: words.polish,
            level: words.level,
            category: words.category,
            imageUrl: words.imageUrl,
            createdAt: words.createdAt,
            creatorName: users.name,
            creatorEmail: users.email,
        })
            .from(words)
            .leftJoin(users, eq(words.createdBy, users.id)) // Dołączenie tabeli użytkowników (JOIN)
            .where(whereClause)
            .limit(ITEMS_PER_PAGE)
            .offset(offset)
            .orderBy(words.level, words.english);

        return NextResponse.json({ words: wordsList });
    } catch (error) {
        console.error('Błąd podczas pobierania słówek:', error);
        return NextResponse.json({ error: 'Failed to fetch words' }, { status: 500 });
    }
}
