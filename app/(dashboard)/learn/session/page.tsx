import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { words, wordProgress } from '@/lib/db/schema';
import { eq, and, lte, isNull, sql, notInArray, desc } from 'drizzle-orm';
import { LearningClient } from './_components/learning-client';
import { Card, CardContent } from '@/components/ui/card';

interface SessionPageProps {
    searchParams: Promise<{
        level?: string;
        category?: string;
        mode?: string;
    }>;
}

const SESSION_SIZE = 15;

export default async function SessionPage(props: SessionPageProps) {
    const searchParams = await props.searchParams;
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        redirect('/login');
    }

    const userId: string = session.user.id;
    const level = searchParams.level;
    const category = searchParams.category;
    const mode = (searchParams.mode || 'pl_to_en_text') as any;

    if (!level) {
        redirect('/learn');
    }

    // 1. Pobranie słówek przeznaczonych do powtórki (interwał minął)
    // Wyszukiwanie w wordProgress słówek, które:
    // - Są przypisane do aktualnego użytkownika
    // - Termin powtórki minął lub przypada teraz
    // - Opcjonalne filtrowanie po poziomie/kategorii (wymaga złączenia z tabelą words)

    // Pobranie szczegółów słówek do powtórki
    const reviewsQuery = db
        .select({
            english: words.english,
            polish: words.polish,
            level: words.level,
            category: words.category,
            imageUrl: words.imageUrl,
            // progress info
            reviewDate: wordProgress.nextReviewDate,
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
                level ? eq(words.level, level as any) : undefined,
                category ? eq(words.category, category) : undefined
            )
        )
        .limit(SESSION_SIZE);

    const reviews = await reviewsQuery;

    // 2. Uzupełnienie sesji nowymi słówkami (jeśli jest miejsce)
    let newWords: any[] = [];
    const spotsLeft = SESSION_SIZE - reviews.length;

    if (spotsLeft > 0) {
        // Wybór słówek, które nie posiadają jeszcze postępu dla tego użytkownika
        // Wykorzystanie LEFT JOIN i warunku NULL na wordProgress

        const newWordsQuery = db
            .select({
                english: words.english,
                polish: words.polish,
                level: words.level,
                category: words.category,
                imageUrl: words.imageUrl,
            })
            .from(words)
            .leftJoin(
                wordProgress,
                and(
                    eq(wordProgress.wordEnglish, words.english),
                    eq(wordProgress.userId, userId)
                )
            )
            .where(
                and(
                    isNull(wordProgress.id), // Brak postępu oznacza nowe słówko
                    level ? eq(words.level, level as any) : undefined,
                    category ? eq(words.category, category) : undefined
                )
            )
            .limit(spotsLeft);
        // Losowanie w bazie danych (zakomentowane):
        // .orderBy(sql`RANDOM()`) - w Neon/Postgres zadziała

        newWords = await newWordsQuery;
    }

    // 3. Połączenie powtórek i nowych słówek
    const sessionWords = [...reviews, ...newWords];

    // Mieszanie tablicy algorytmem Fishera-Yatesa
    for (let i = sessionWords.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [sessionWords[i], sessionWords[j]] = [sessionWords[j], sessionWords[i]];
    }

    // Mapowanie danych do formatu oczekiwanego przez klienta
    const clientWords = sessionWords.map(w => ({
        id: w.english, // Tymczasowe użycie angielskiego słowa jako ID
        english: w.english,
        polish: w.polish,
        level: w.level,
        category: w.category,
        imageUrl: w.imageUrl
    }));

    if (clientWords.length === 0) {
        return (
            <div className="w-full max-w-2xl mx-auto py-8 space-y-6">
                {/* Główna kartka informacyjna */}
                <Card className="border-2 border-blue-500/30 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 shadow-xl">
                    <CardContent className="pt-8 pb-8 space-y-6">
                        {/* Ikona informacyjna */}
                        <div className="flex justify-center">
                            <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center text-6xl shadow-lg">
                                📚
                            </div>
                        </div>

                        {/* Tytuł */}
                        <div className="text-center space-y-3">
                            <h2 className="text-3xl md:text-4xl font-bold text-blue-900 dark:text-blue-100">
                                Brak słówek do powtórki
                            </h2>
                            <p className="text-lg text-blue-700 dark:text-blue-300">
                                W tej chwili nie masz dostępnych słówek do nauki
                            </p>
                        </div>

                        {/* Wyjaśnienie */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-md border border-blue-200 dark:border-blue-800 max-w-lg mx-auto">
                            <h3 className="font-semibold text-lg mb-3 text-slate-900 dark:text-slate-100">
                                Co to znaczy?
                            </h3>
                            <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
                                <div className="flex gap-3">
                                    <span className="text-green-600 dark:text-green-400 text-lg">✓</span>
                                    <div>
                                        <p className="font-medium">Gratulacje!</p>
                                        <p className="text-slate-600 dark:text-slate-400">
                                            Wszystkie słówka z poziomu <span className="font-bold text-blue-600 dark:text-blue-400">{level}</span>
                                            {category && <> w kategorii <span className="font-bold text-blue-600 dark:text-blue-400">{category}</span></>} zostały już przerobione
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <span className="text-amber-600 dark:text-amber-400 text-lg">⏰</span>
                                    <div>
                                        <p className="font-medium">Czekaj na powtórki</p>
                                        <p className="text-slate-600 dark:text-slate-400">
                                            Słówka pojawią się ponownie zgodnie z harmonogramem powtórek (algorytm SM-2)
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <span className="text-purple-600 dark:text-purple-400 text-lg">🎯</span>
                                    <div>
                                        <p className="font-medium">Kontynuuj naukę</p>
                                        <p className="text-slate-600 dark:text-slate-400">
                                            Możesz wybrać inny poziom lub kategorię, aby uczyć się nowych słówek
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Zachęta */}
                        <div className="text-center max-w-md mx-auto">
                            <p className="text-base text-slate-700 dark:text-slate-300">
                                💪 Świetna robota! Regularność jest kluczem do sukcesu.
                                Wróć później lub wybierz inne materiały do nauki.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Akcje */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <a
                        href="/learn"
                        className="flex items-center justify-center w-full h-14 text-lg px-6 py-3 bg-primary text-primary-foreground rounded-lg shadow-lg hover:shadow-xl transition-all font-semibold"
                    >
                        🏠 Wybierz inną kategorię
                    </a>
                    <a
                        href="/statistics"
                        className="flex items-center justify-center w-full h-14 text-lg px-6 py-3 bg-secondary text-secondary-foreground rounded-lg shadow-md hover:shadow-lg transition-all font-semibold"
                    >
                        📊 Zobacz statystyki
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-10 px-4">
            <LearningClient
                initialWords={clientWords}
                mode={mode}
                userName={session.user.name || 'Użytkowniku'}
            />
        </div>
    );
}
