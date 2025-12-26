import { auth } from '@/lib/auth';
import { getAllWordsForCategories } from '@/lib/cached-data';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { userStats, wordProgress, words } from '@/lib/db/schema';
import { eq, and, lte, sql } from 'drizzle-orm';
import { StartLearningCard } from './_components/start-learning-card';
import { StatsCard } from './_components/stats-card';
import { PageLayout } from '@/components/page-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default async function LearnPage() {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        redirect('/login');
    }

    const userId = session.user.id;

    // Pobranie statystyk użytkownika z bazy danych
    const stats = await db.query.userStats.findFirst({
        where: eq(userStats.userId, userId),
    });

    // Pobranie wszystkich słówek z uwzględnieniem poziomów i kategorii (z wykorzystaniem pamięci podręcznej)
    const allWords = await getAllWordsForCategories();

    // Pobranie informacji o postępach użytkownika (identyfikacja słówek już poznanych)
    const userProgress = await db.query.wordProgress.findMany({
        where: eq(wordProgress.userId, userId),
        columns: {
            wordEnglish: true,
        },
    });

    const learnedWords = new Set(userProgress.map(p => p.wordEnglish));

    // Pobranie liczby słówek do powtórki (dla powiadomienia)
    const dueReviewsCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(wordProgress)
        .innerJoin(words, eq(wordProgress.wordEnglish, words.english))
        .where(
            and(
                eq(wordProgress.userId, userId),
                lte(wordProgress.nextReviewDate, new Date())
            )
        );
    
    const reviewsDue = Number(dueReviewsCount[0]?.count || 0);

    // Grupowanie słówek według poziomów i kategorii oraz obliczanie postępu
    const categoriesByLevel = allWords.reduce((acc, word) => {
        if (!acc[word.level]) {
            acc[word.level] = {};
        }
        if (!acc[word.level][word.category]) {
            acc[word.level][word.category] = {
                total: 0,
                learned: 0,
            };
        }
        acc[word.level][word.category].total += 1;
        if (learnedWords.has(word.english)) {
            acc[word.level][word.category].learned += 1;
        }
        return acc;
    }, {} as Record<string, Record<string, { total: number; learned: number }>>);

    // Konwersja danych do struktury wymaganej przez komponent interfejsu
    const structuredCategories = Object.entries(categoriesByLevel).reduce((acc, [level, categories]) => {
        acc[level] = Object.entries(categories).reduce((catAcc, [category, catStats]) => {
            catAcc[category] = catStats;
            return catAcc;
        }, {} as Record<string, { total: number; learned: number }>);
        return acc;
    }, {} as Record<string, Record<string, { total: number; learned: number }>>);

    // Obliczenie ogólnego postępu
    const totalWords = allWords.length;
    const totalLearned = learnedWords.size;
    const overallProgress = totalWords > 0 ? Math.round((totalLearned / totalWords) * 100) : 0;

    return (
        <PageLayout
            title="Nauka nowych słówek"
            description="Ucz się nowych słówek z wybranej kategorii"
        >
            {/* Alert o słówkach do powtórki */}
            {reviewsDue > 0 && (
                <Card className="border-2 border-amber-500/30 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 mb-6">
                    <CardContent className="flex items-center gap-4 py-4">
                        <div className="p-3 bg-amber-100 dark:bg-amber-900/50 rounded-full">
                            <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                                Masz {reviewsDue} {reviewsDue === 1 ? 'słówko' : reviewsDue < 5 ? 'słówka' : 'słówek'} do powtórki!
                            </h3>
                            <p className="text-sm text-amber-700 dark:text-amber-300">
                                Powtórki pomagają utrwalić wiedzę długoterminowo
                            </p>
                        </div>
                        <Link href="/review">
                            <Button className="bg-amber-600 hover:bg-amber-700 text-white shadow-lg gap-2">
                                <RefreshCw className="w-4 h-4" />
                                Powtórz teraz
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            )}

            {/* Statystyki */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatsCard
                    label="Daily Streak"
                    value={stats?.currentStreak || 0}
                    icon="🔥"
                    subtext="dni z rzędu"
                />
                <StatsCard
                    label="Nauczone słówka"
                    value={totalLearned}
                    icon="📚"
                    subtext={`z ${totalWords}`}
                />
                <StatsCard
                    label="Postęp całkowity"
                    value={`${overallProgress}%`}
                    icon="📈"
                    subtext="opanowane"
                />
                <StatsCard
                    label="Czas nauki"
                    value={Math.round((stats?.totalTimeMs || 0) / 1000 / 60)}
                    icon="⏱️"
                    subtext="minut"
                />
            </div>

            <div className="max-w-2xl mx-auto mt-6">
                <StartLearningCard categoriesByLevel={structuredCategories} />
            </div>
        </PageLayout>
    );
}
