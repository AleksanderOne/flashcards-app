import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { words, wordProgress, userStats } from '@/lib/db/schema';
import { eq, and, lte, sql } from 'drizzle-orm';
import { PageLayout } from '@/components/page-layout';
import { ReviewCard } from './_components/review-card';
import { StatsCard } from '../learn/_components/stats-card';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BookOpen, Clock, CheckCircle2, Zap } from 'lucide-react';

export default async function ReviewPage() {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        redirect('/login');
    }

    const userId = session.user.id;

    // Pobranie statystyk użytkownika
    const stats = await db.query.userStats.findFirst({
        where: eq(userStats.userId, userId),
    });

    // Pobranie słówek do powtórki (termin minął)
    const dueReviews = await db
        .select({
            english: words.english,
            polish: words.polish,
            level: words.level,
            category: words.category,
            imageUrl: words.imageUrl,
            nextReview: wordProgress.nextReviewDate,
            interval: wordProgress.interval,
            repetitions: wordProgress.repetitions,
            easiness: wordProgress.easinessFactor,
        })
        .from(words)
        .innerJoin(
            wordProgress,
            and(
                eq(wordProgress.wordEnglish, words.english),
                eq(wordProgress.userId, userId)
            )
        )
        .where(lte(wordProgress.nextReviewDate, new Date()))
        .orderBy(wordProgress.nextReviewDate);

    // Pobranie słówek zaplanowanych na potem (najbliższe 7 dni)
    const upcomingDate = new Date();
    upcomingDate.setDate(upcomingDate.getDate() + 7);

    const upcomingReviews = await db
        .select({
            english: words.english,
            polish: words.polish,
            level: words.level,
            category: words.category,
            nextReview: wordProgress.nextReviewDate,
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
                sql`${wordProgress.nextReviewDate} > NOW()`,
                lte(wordProgress.nextReviewDate, upcomingDate)
            )
        )
        .orderBy(wordProgress.nextReviewDate)
        .limit(20);

    // Grupowanie słówek do powtórki według kategorii
    const reviewsByCategory = dueReviews.reduce((acc, word) => {
        const key = `${word.level} - ${word.category}`;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(word);
        return acc;
    }, {} as Record<string, typeof dueReviews>);

    // Całkowita liczba słówek użytkownika
    const totalWordsLearned = await db
        .select({ count: sql<number>`count(*)` })
        .from(wordProgress)
        .where(eq(wordProgress.userId, userId));

    const totalCount = Number(totalWordsLearned[0]?.count || 0);

    return (
        <PageLayout
            title="Powtórki"
            description="Powtarzaj słówka według algorytmu spaced repetition (SM-2)"
        >
            {/* Statystyki */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatsCard
                    label="Do powtórki"
                    value={dueReviews.length}
                    icon="🔄"
                    subtext="teraz"
                />
                <StatsCard
                    label="Nadchodzące"
                    value={upcomingReviews.length}
                    icon="📅"
                    subtext="w tym tygodniu"
                />
                <StatsCard
                    label="Wszystkie słówka"
                    value={totalCount}
                    icon="📚"
                    subtext="w trakcie nauki"
                />
                <StatsCard
                    label="Longest Streak"
                    value={stats?.longestStreak || 0}
                    icon="🏆"
                    subtext="dni"
                />
            </div>

            {/* Główna sekcja powtórek */}
            <div className="space-y-6 mt-6">
                {dueReviews.length > 0 ? (
                    <>
                        {/* Szybka powtórka - główny CTA */}
                        <Card className="border-2 border-amber-500/50 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 dark:from-amber-950/30 dark:via-orange-950/30 dark:to-amber-950/30 shadow-lg">
                            <CardContent className="py-6">
                                <div className="flex flex-col md:flex-row items-center gap-6">
                                    <div className="p-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-lg">
                                        <Zap className="w-10 h-10 text-white" />
                                    </div>
                                    <div className="flex-1 text-center md:text-left">
                                        <h3 className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                                            {dueReviews.length} {dueReviews.length === 1 ? 'słówko' : dueReviews.length < 5 ? 'słówka' : 'słówek'} do powtórki
                                        </h3>
                                        <p className="text-amber-700 dark:text-amber-300 mt-1">
                                            Kliknij aby rozpocząć szybką powtórkę wszystkich słówek
                                        </p>
                                    </div>
                                    <Link href="/review/session" className="w-full md:w-auto">
                                        <Button
                                            size="lg"
                                            className="w-full md:w-auto h-14 px-8 text-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-xl hover:shadow-2xl transition-all gap-2"
                                        >
                                            <Zap className="w-5 h-5" />
                                            Szybka powtórka
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Karta wyboru powtórek */}
                        <ReviewCard
                            reviewsByCategory={reviewsByCategory}
                            totalDueCount={dueReviews.length}
                        />
                    </>
                ) : (
                    /* Brak słówek do powtórki */
                    <Card className="border-2 border-green-500/30 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                        <CardContent className="py-12 text-center space-y-6">
                            <div className="flex justify-center">
                                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                                    <CheckCircle2 className="w-10 h-10 text-white" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-green-900 dark:text-green-100">
                                    Wszystko powtórzone! 🎉
                                </h2>
                                <p className="text-green-700 dark:text-green-300 max-w-md mx-auto">
                                    Nie masz teraz żadnych słówek do powtórki.
                                    Wróć później lub ucz się nowych słówek!
                                </p>
                            </div>

                            {totalCount === 0 && (
                                <div className="pt-4">
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                        Nie masz jeszcze żadnych słówek w systemie powtórek.
                                    </p>
                                    <Link href="/learn">
                                        <Button className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white shadow-lg">
                                            <BookOpen className="w-5 h-5 mr-2" />
                                            Zacznij naukę nowych słówek
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Nadchodzące powtórki */}
                {upcomingReviews.length > 0 && (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Clock className="w-5 h-5 text-blue-500" />
                                <h3 className="font-semibold text-lg">Nadchodzące powtórki</h3>
                            </div>
                            <div className="space-y-2">
                                {upcomingReviews.slice(0, 10).map((word) => (
                                    <div
                                        key={word.english}
                                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="font-medium">{word.english}</span>
                                            <span className="text-sm text-muted-foreground">→</span>
                                            <span className="text-muted-foreground">{word.polish}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 rounded text-xs">
                                                {word.level}
                                            </span>
                                            <span>
                                                za {Math.ceil((new Date(word.nextReview!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} dni
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {upcomingReviews.length > 10 && (
                                    <p className="text-sm text-center text-muted-foreground pt-2">
                                        ...i {upcomingReviews.length - 10} więcej
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </PageLayout>
    );
}

