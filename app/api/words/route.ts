import { db } from '@/lib/db/drizzle';
import { words, users } from '@/lib/db/schema';
import { ilike, or, and, eq, desc } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

const ITEMS_PER_PAGE = 20;

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get('query') || '';
        const category = searchParams.get('category') || 'all';
        const level = searchParams.get('level') || 'all';
        const page = Number(searchParams.get('page')) || 1;
        const offset = (page - 1) * ITEMS_PER_PAGE;

        // Budowanie filtrów zapytania
        const filters = [];

        if (query) {
            filters.push(or(
                ilike(words.english, `%${query}%`),
                ilike(words.polish, `%${query}%`)
            ));
        }

        if (category && category !== 'all') {
            filters.push(eq(words.category, category));
        }

        if (level && level !== 'all') {
            filters.push(eq(words.level, level as any));
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
