import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { words, wordProgress, learningSessions } from '@/lib/db/schema';
import { eq, and, lte, sql } from 'drizzle-orm';
import { LearningClient } from '../../learn/session/_components/learning-client';
import { Card, CardContent } from '@/components/ui/card';
import { PageLayout } from '@/components/page-layout';
import { CheckCircle2, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LevelType } from '@/lib/constants';

interface ReviewSessionPageProps {
    searchParams: Promise<{
        level?: string;
        category?: string;
        mode?: string;
    }>;
}

const SESSION_SIZE = 15;

export default async function ReviewSessionPage(props: ReviewSessionPageProps) {
    const searchParams = await props.searchParams;
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        redirect('/login');
    }

    const userId: string = session.user.id;
    const level = searchParams.level;
    const category = searchParams.category;
    const mode = (searchParams.mode || 'pl_to_en_text') as 'pl_to_en_text' | 'en_to_pl_text' | 'pl_to_en_quiz' | 'en_to_pl_quiz';

    // Pobranie TYLKO słówek do powtórki (termin minął) - NIE nowych słówek
    const reviewsQuery = db
        .select({
            english: words.english,
            polish: words.polish,
            level: words.level,
            category: words.category,
            imageUrl: words.imageUrl,
            reviewDate: wordProgress.nextReviewDate,
            easiness: wordProgress.easinessFactor,
            repetitions: wordProgress.repetitions,
            interval: wordProgress.interval,
        })
        .from(words)
        .innerJoin(
            wordProgress,
            and(
                eq(wordProgress.wordEnglish, words.english),
                eq(wordProgress.userId, userId)
            )
        )
        .where(
            and(
                lte(wordProgress.nextReviewDate, new Date()), // Termin powtórki minął
                level ? eq(words.level, level as LevelType) : undefined,
                category ? eq(words.category, category) : undefined
            )
        )
        .limit(SESSION_SIZE);

    const reviews = await reviewsQuery;

    // Pobranie statystyk błędów dla każdego słówka (ile razy poprawnie vs błędnie)
    const wordStats = await db
        .select({
            wordEnglish: learningSessions.wordEnglish,
            totalAttempts: sql<number>`count(*)`,
            correctAttempts: sql<number>`sum(case when ${learningSessions.isCorrect} then 1 else 0 end)`,
            incorrectAttempts: sql<number>`sum(case when ${learningSessions.isCorrect} then 0 else 1 end)`,
        })
        .from(learningSessions)
        .where(eq(learningSessions.userId, userId))
        .groupBy(learningSessions.wordEnglish);

    // Mapowanie statystyk do słownika
    const statsMap = new Map(wordStats.map(s => [s.wordEnglish, {
        total: Number(s.totalAttempts),
        correct: Number(s.correctAttempts),
        incorrect: Number(s.incorrectAttempts),
    }]));

    // Mieszanie tablicy algorytmem Fishera-Yatesa
    for (let i = reviews.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [reviews[i], reviews[j]] = [reviews[j], reviews[i]];
    }

    // Mapowanie danych do formatu oczekiwanego przez klienta (z trudnością)
    const clientWords = reviews.map(w => {
        const stats = statsMap.get(w.english);
        // Obliczenie trudności na podstawie: współczynnika łatwości SM-2 i % błędów
        // easiness: 1.3 (trudne) - 2.5+ (łatwe)
        // Trudność: 1 (łatwe) - 5 (bardzo trudne)
        let difficulty = 1;
        if (stats && stats.total > 0) {
            const errorRate = stats.incorrect / stats.total;
            // Kombinacja errorRate i easiness
            difficulty = Math.min(5, Math.max(1, Math.round(
                (errorRate * 3) + ((2.5 - (w.easiness || 2.5)) * 2) + 1
            )));
        }

        return {
            id: w.english,
            english: w.english,
            polish: w.polish,
            level: w.level,
            category: w.category,
            imageUrl: w.imageUrl,
            // Dane o trudności
            difficulty,
            errorCount: stats?.incorrect || 0,
            totalAttempts: stats?.total || 0,
            easiness: w.easiness,
        };
    });

    if (clientWords.length === 0) {
        return (
            <PageLayout maxWidth="2xl">
                {/* Karta informacyjna - brak słówek do powtórki */}
                <Card className="border-2 border-green-500/30 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 shadow-xl">
                    <CardContent className="pt-8 pb-8 space-y-6">
                        {/* Ikona sukcesu */}
                        <div className="flex justify-center">
                            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-6xl shadow-lg">
                                <CheckCircle2 className="w-12 h-12 text-white" />
                            </div>
                        </div>

                        {/* Tytuł */}
                        <div className="text-center space-y-3">
                            <h2 className="text-3xl md:text-4xl font-bold text-green-900 dark:text-green-100">
                                Brak słówek do powtórki! 🎉
                            </h2>
                            <p className="text-lg text-green-700 dark:text-green-300">
                                Wszystko powtórzone - świetna robota!
                            </p>
                        </div>

                        {/* Wyjaśnienie */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-md border border-green-200 dark:border-green-800 max-w-lg mx-auto">
                            <h3 className="font-semibold text-lg mb-3 text-slate-900 dark:text-slate-100">
                                Co możesz teraz zrobić?
                            </h3>
                            <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
                                <div className="flex gap-3">
                                    <span className="text-violet-600 dark:text-violet-400 text-lg">📚</span>
                                    <div>
                                        <p className="font-medium">Ucz się nowych słówek</p>
                                        <p className="text-slate-600 dark:text-slate-400">
                                            Dodaj nowe słówka do swojego słownika
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <span className="text-amber-600 dark:text-amber-400 text-lg">⏰</span>
                                    <div>
                                        <p className="font-medium">Wróć później</p>
                                        <p className="text-slate-600 dark:text-slate-400">
                                            Słówka pojawią się do powtórki zgodnie z harmonogramem
                                        </p>
                                    </div>
                                </div>

                                {(level || category) && (
                                    <div className="flex gap-3">
                                        <span className="text-blue-600 dark:text-blue-400 text-lg">🎯</span>
                                        <div>
                                            <p className="font-medium">Zmień kategorię</p>
                                            <p className="text-slate-600 dark:text-slate-400">
                                                Sprawdź inne kategorie - mogą mieć słówka do powtórki
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Akcje */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Link href="/review" className="w-full">
                        <Button
                            variant="outline"
                            className="w-full h-14 text-lg"
                        >
                            🔄 Wróć do powtórek
                        </Button>
                    </Link>
                    <Link href="/learn" className="w-full">
                        <Button
                            className="w-full h-14 text-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white shadow-lg"
                        >
                            <BookOpen className="w-5 h-5 mr-2" />
                            Ucz się nowych słówek
                        </Button>
                    </Link>
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout>
            <LearningClient
                initialWords={clientWords}
                mode={mode}
                userName={session.user.name || 'Użytkowniku'}
                sessionType="review"
            />
        </PageLayout>
    );
}

