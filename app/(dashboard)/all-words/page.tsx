import { auth } from '@/lib/auth';
import { db } from '@/lib/db/drizzle';
import { words, users } from '@/lib/db/schema';
import { ilike, sql, or, and, eq } from 'drizzle-orm';
import { LevelType } from '@/lib/constants';
import { redirect } from 'next/navigation';
import { Search } from '@/components/search';
import { WordsFilter } from './words-filter';
import { InfiniteScrollControls } from './infinite-scroll-controls';
import { WordsTableInfinite } from './words-table-infinite';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PageLayout } from '@/components/page-layout';

interface AllWordsPageProps {
    searchParams: Promise<{
        query?: string;
        page?: string;
        category?: string;
        level?: string;
        infiniteScroll?: string;
    }>;
}

const ITEMS_PER_PAGE = 20;

export default async function AllWordsPage(props: AllWordsPageProps) {
    const searchParams = await props.searchParams;
    const query = searchParams.query || '';
    const category = searchParams.category || 'all';
    const level = searchParams.level || 'all';
    const infiniteScroll = searchParams.infiniteScroll === 'true';
    const currentPage = Number(searchParams.page) || 1;
    const offset = infiniteScroll ? 0 : (currentPage - 1) * ITEMS_PER_PAGE;

    const session = await auth();
    if (!session) redirect('/login');
    const isAdmin = session.user.role === 'admin';

    // Get categories for filter
    const categoriesResult = await db.selectDistinct({ category: words.category })
        .from(words)
        .where(eq(words.isApproved, true))
        .orderBy(words.category);
    const categories = categoriesResult.map(c => c.category);
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1'];

    // Query for words
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
        filters.push(eq(words.level, level as LevelType));
    }

    // Tylko zatwierdzone słówka
    filters.push(eq(words.isApproved, true));

    const whereClause = filters.length > 0 ? and(...filters) : undefined;

    // Pobieramy słówka
    const wordsList = await db.select({
        id: words.id,
        english: words.english,
        polish: words.polish,
        level: words.level,
        category: words.category,
        imageUrl: words.imageUrl,
        creatorName: users.name
    })
        .from(words)
        .leftJoin(users, eq(words.createdBy, users.id))
        .where(whereClause)
        .limit(ITEMS_PER_PAGE)
        .offset(offset)
        .orderBy(words.level, words.english);

    // Count total for pagination
    const totalCountResult = await db.select({ count: sql<number>`count(*)` })
        .from(words)
        .where(whereClause);

    const totalPages = Math.ceil(Number(totalCountResult[0].count) / ITEMS_PER_PAGE);
    const totalCount = Number(totalCountResult[0].count);

    return (
        <PageLayout
            title="Baza Słówek"
            description={`Przeglądaj wszystkie dostępne słówka w bazie. ${totalCount} ${totalCount === 1 ? 'słówko' : totalCount < 5 ? 'słówka' : 'słówek'}`}
        >

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex-1 min-w-0">
                    <Search placeholder="Szukaj słówka..." />
                </div>
                <div className="flex flex-wrap items-center gap-4 shrink-0">
                    <WordsFilter categories={categories} levels={levels} />
                    <InfiniteScrollControls />
                </div>
            </div>

            <WordsTableInfinite
                initialWords={wordsList.map(w => ({
                    id: w.id,
                    english: w.english,
                    polish: w.polish,
                    level: w.level,
                    category: w.category,
                    creatorName: w.creatorName,
                    imageUrl: w.imageUrl
                }))}
                isAdmin={isAdmin}
                disableInfiniteScroll={!infiniteScroll}
            />

            {!infiniteScroll && (
                <div className="flex items-center justify-center gap-2">
                    <Link
                        href={`/all-words?query=${query}&category=${category}&level=${level}&page=${currentPage - 1}`}
                        className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                    >
                        <Button variant="outline" size="icon" disabled={currentPage <= 1}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <span className="text-sm font-medium">
                        Strona {currentPage} z {totalPages || 1}
                    </span>
                    <Link
                        href={`/all-words?query=${query}&category=${category}&level=${level}&page=${currentPage + 1}`}
                        className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                    >
                        <Button variant="outline" size="icon" disabled={currentPage >= totalPages}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            )}
        </PageLayout>
    );
}
