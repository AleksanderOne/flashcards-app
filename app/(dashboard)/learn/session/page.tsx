import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { words, wordProgress } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { LearningClient } from './_components/learning-client';
import { Card, CardContent } from '@/components/ui/card';
import { PageLayout } from '@/components/page-layout';

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

    // NAUKA: Pobranie TYLKO nowych słówek (bez powtórek)
    // Słówka, które nie posiadają jeszcze postępu dla tego użytkownika
    // Powtórki są obsługiwane w osobnym widoku /review
    
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
        .limit(SESSION_SIZE);

    const sessionWords = await newWordsQuery;

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
            <PageLayout maxWidth="2xl">
                {/* Główna kartka informacyjna - wszystkie nowe słówka przerobione */}
                <Card className="border-2 border-green-500/30 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 shadow-xl">
                    <CardContent className="pt-8 pb-8 space-y-6">
                        {/* Ikona sukcesu */}
                        <div className="flex justify-center">
                            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-6xl shadow-lg">
                                🎉
                            </div>
                        </div>

                        {/* Tytuł */}
                        <div className="text-center space-y-3">
                            <h2 className="text-3xl md:text-4xl font-bold text-green-900 dark:text-green-100">
                                Kategoria ukończona!
                            </h2>
                            <p className="text-lg text-green-700 dark:text-green-300">
                                Wszystkie nowe słówka w tej kategorii zostały nauczone
                            </p>
                        </div>

                        {/* Wyjaśnienie */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-md border border-green-200 dark:border-green-800 max-w-lg mx-auto">
                            <h3 className="font-semibold text-lg mb-3 text-slate-900 dark:text-slate-100">
                                Co dalej?
                            </h3>
                            <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
                                <div className="flex gap-3">
                                    <span className="text-green-600 dark:text-green-400 text-lg">✓</span>
                                    <div>
                                        <p className="font-medium">Gratulacje!</p>
                                        <p className="text-slate-600 dark:text-slate-400">
                                            Wszystkie słówka z poziomu <span className="font-bold text-green-600 dark:text-green-400">{level}</span>
                                            {category && <> w kategorii <span className="font-bold text-green-600 dark:text-green-400">{category}</span></>} zostały już nauczone!
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <span className="text-amber-600 dark:text-amber-400 text-lg">🔄</span>
                                    <div>
                                        <p className="font-medium">Powtórki</p>
                                        <p className="text-slate-600 dark:text-slate-400">
                                            Przejdź do sekcji <a href="/review" className="text-amber-600 underline font-medium">Powtórki</a> aby utrwalić nauczone słówka
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <span className="text-violet-600 dark:text-violet-400 text-lg">🎯</span>
                                    <div>
                                        <p className="font-medium">Nowe kategorie</p>
                                        <p className="text-slate-600 dark:text-slate-400">
                                            Wybierz inny poziom lub kategorię, aby kontynuować naukę
                                        </p>
                                    </div>
                                </div>
                            </div>
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
                        href="/review"
                        className="flex items-center justify-center w-full h-14 text-lg px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg shadow-md hover:shadow-lg transition-all font-semibold"
                    >
                        🔄 Przejdź do powtórek
                    </a>
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
            />
        </PageLayout>
    );
}
