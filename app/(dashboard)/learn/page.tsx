import { auth } from '@/lib/auth';
import { getAllWordsForCategories } from '@/lib/cached-data';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { userStats, wordProgress } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { StartLearningCard } from './_components/start-learning-card';
import { StatsCard } from './_components/stats-card';

export default async function LearnPage() {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        redirect('/login');
    }

    // Pobranie statystyk użytkownika z bazy danych
    const stats = await db.query.userStats.findFirst({
        where: eq(userStats.userId, session.user.id),
    });

    // Pobranie wszystkich słówek z uwzględnieniem poziomów i kategorii (z wykorzystaniem pamięci podręcznej)
    const allWords = await getAllWordsForCategories();

    // Pobranie informacji o postępach użytkownika (identyfikacja słówek już poznanych)
    const userProgress = await db.query.wordProgress.findMany({
        where: eq(wordProgress.userId, session.user.id),
        columns: {
            wordEnglish: true,
        },
    });

    const learnedWords = new Set(userProgress.map(p => p.wordEnglish));

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
        acc[level] = Object.entries(categories).reduce((catAcc, [category, stats]) => {
            catAcc[category] = stats;
            return catAcc;
        }, {} as Record<string, { total: number; learned: number }>);
        return acc;
    }, {} as Record<string, Record<string, { total: number; learned: number }>>);

    return (
        <div className="p-8 space-y-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
                        Witaj, {session.user.name?.split(' ')[0]}! 👋
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Gotowy na dzisiejszą dawkę wiedzy?
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard
                    label="Daily Streak"
                    value={stats?.currentStreak || 0}
                    icon="🔥"
                    subtext="dni z rzędu"
                />
                <StatsCard
                    label="Nauczone słówka"
                    value={stats?.totalWordsLearned || 0}
                    icon="📚"
                    subtext="łącznie"
                />
                <StatsCard
                    label="Czas nauki"
                    value={Math.round((stats?.totalTimeMs || 0) / 1000 / 60)}
                    icon="⏱️"
                    subtext="minut"
                />
            </div>

            <div className="max-w-2xl mx-auto mt-10">
                <StartLearningCard categoriesByLevel={structuredCategories} />
            </div>
        </div>
    );
}
