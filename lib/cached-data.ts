import { unstable_cache } from 'next/cache';
import { db } from '@/lib/db/drizzle';

/**
 * Cached version of fetching all words for learning page classification.
 * This is heavy because it fetches all words, so we cache it aggressively.
 * Revalidate every hour or on-demand with tag 'all-words-list'.
 */
export const getAllWordsForCategories = unstable_cache(
    async () => {
        return await db.query.words.findMany({
            columns: {
                english: true,
                category: true,
                level: true,
            },
        });
    },
    ['all-words-list'],
    {
        revalidate: 3600, // 1 hour
        tags: ['all-words-list']
    }
);
