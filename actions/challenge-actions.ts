'use server'

import { db } from '@/lib/db/drizzle';
import { words, customWords, wordProgress } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { eq, and, gt } from 'drizzle-orm';

export interface ChallengeWord {
    english: string;
    polish: string;
}

export async function getLearnedWordsForChallenge(): Promise<ChallengeWord[]> {
    const session = await auth();
    if (!session?.user?.id) {
        return [];
    }

    const userId = session.user.id;

    // Pobieranie słówek systemowych (zatwierdzonych).
    // Dołączenie tabeli words do postępu, aby uzyskać polskie tłumaczenia.
    const systemWords = await db
        .select({
            english: wordProgress.wordEnglish,
            polish: words.polish,
        })
        .from(wordProgress)
        .innerJoin(words, eq(wordProgress.wordEnglish, words.english))
        .where(
            and(
                eq(wordProgress.userId, userId),
                gt(wordProgress.repetitions, 0)
            )
        );

    // Pobieranie prywatnych słówek użytkownika
    const userCustomWords = await db
        .select({
            english: wordProgress.wordEnglish,
            polish: customWords.polish
        })
        .from(wordProgress)
        .innerJoin(customWords, eq(wordProgress.wordEnglish, customWords.english))
        .where(
            and(
                eq(wordProgress.userId, userId),
                gt(wordProgress.repetitions, 0),
                eq(customWords.userId, userId)
            )
        );

    // Agregacja wyników z obu źródeł
    const allWords = [...systemWords, ...userCustomWords];

    // Usuwanie powtarzających się wpisów
    const uniqueMap = new Map<string, string>();
    allWords.forEach(w => {
        if (!uniqueMap.has(w.english)) {
            uniqueMap.set(w.english, w.polish);
        }
    });

    return Array.from(uniqueMap.entries()).map(([english, polish]) => ({ english, polish }));
}
