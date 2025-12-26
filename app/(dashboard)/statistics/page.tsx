import { auth } from '@/lib/auth';
import { db } from '@/lib/db/drizzle';
import { eq, sql, and, gte, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ActivityChart } from './_components/activity-chart';
import { MasteryChart } from './_components/mastery-chart';
import { AccuracyChart } from './_components/accuracy-chart';
import { LevelDistributionChart } from './_components/level-distribution-chart';
import { CategoryChart } from './_components/category-chart';
import { ProgressChart } from './_components/progress-chart';
import { LearningModeChart } from './_components/learning-mode-chart';
import { TimeChart } from './_components/time-chart';
import { DifficultWords } from './_components/difficult-words';
import { StatsFilters } from './_components/stats-filters';
import { StatsCard } from '../learn/_components/stats-card';
import { userStats, learningSessions, wordProgress } from '@/lib/db/schema';
import { PageLayout } from '@/components/page-layout';
import { Suspense } from 'react';
import { 
    TrendingUp, 
    Target, 
    Clock, 
    Flame, 
    BookOpen, 
    BarChart3, 
    PieChart as PieChartIcon,
    AlertTriangle,
    Award,
    CalendarDays,
    CheckCircle,
    XCircle,
    History
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface StatisticsPageProps {
    searchParams: Promise<{
        range?: string;
    }>;
}

// Funkcja do obliczania daty początkowej na podstawie zakresu
function getStartDate(range: string): Date | null {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    switch (range) {
        case '1':
            return now; // Dzisiejszy dzień
        case '3':
            now.setDate(now.getDate() - 2);
            return now;
        case '7':
            now.setDate(now.getDate() - 6);
            return now;
        case '30':
            now.setDate(now.getDate() - 29);
            return now;
        case '90':
            now.setDate(now.getDate() - 89);
            return now;
        case '365':
            now.setDate(now.getDate() - 364);
            return now;
        case 'all':
        default:
            return null;
    }
}

// Nazwy trybów nauki
const LEARNING_MODE_LABELS: Record<string, string> = {
    'pl_to_en_text': 'PL → EN (tekst)',
    'en_to_pl_text': 'EN → PL (tekst)',
    'pl_to_en_quiz': 'PL → EN (quiz)',
    'en_to_pl_quiz': 'EN → PL (quiz)',
};

export default async function StatisticsPage(props: StatisticsPageProps) {
    const searchParams = await props.searchParams;
    const range = searchParams.range || '30';
    const startDate = getStartDate(range);
    
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        redirect('/login');
    }
    const userId = session.user.id;

    // 1. Pobierz ogólne statystyki użytkownika
    const stats = await db.query.userStats.findFirst({
        where: eq(userStats.userId, userId),
    });

    // 2. Buduj warunek czasowy dla zapytań
    const timeCondition = startDate 
        ? and(
            eq(learningSessions.userId, userId),
            gte(learningSessions.createdAt, startDate)
          )
        : eq(learningSessions.userId, userId);

    // 3. Pobierz sesje w wybranym zakresie
    const sessionsInRange = await db
        .select({
            id: learningSessions.id,
            wordEnglish: learningSessions.wordEnglish,
            wordPolish: learningSessions.wordPolish,
            isCorrect: learningSessions.isCorrect,
            learningMode: learningSessions.learningMode,
            level: learningSessions.level,
            category: learningSessions.category,
            timeSpentMs: learningSessions.timeSpentMs,
            createdAt: learningSessions.createdAt,
        })
        .from(learningSessions)
        .where(timeCondition)
        .orderBy(learningSessions.createdAt);

    // 4. Oblicz metryki w wybranym okresie
    const totalSessions = sessionsInRange.length;
    const correctAnswers = sessionsInRange.filter(s => s.isCorrect).length;
    const accuracy = totalSessions > 0 ? (correctAnswers / totalSessions) * 100 : 0;
    const totalTimeMs = sessionsInRange.reduce((sum, s) => sum + s.timeSpentMs, 0);
    const avgResponseTime = totalSessions > 0 ? totalTimeMs / totalSessions / 1000 : 0;
    const uniqueWords = new Set(sessionsInRange.map(s => s.wordEnglish)).size;

    // 5. Dane dla wykresu aktywności (sesje na dzień)
    const activityMap = new Map<string, number>();
    sessionsInRange.forEach(s => {
        const dateStr = new Date(s.createdAt).toISOString().split('T')[0];
        activityMap.set(dateStr, (activityMap.get(dateStr) || 0) + 1);
    });

    // Wypełnij dni zerami
    const activityData: { date: string; count: number }[] = [];
    const daysToShow = range === 'all' ? 30 : parseInt(range) || 30;
    for (let i = 0; i < Math.min(daysToShow, 90); i++) {
        const d = new Date();
        d.setDate(d.getDate() - (daysToShow - 1 - i));
        const dateStr = d.toISOString().split('T')[0];
        activityData.push({
            date: dateStr,
            count: activityMap.get(dateStr) || 0
        });
    }

    // 6. Dane dla wykresu skuteczności w czasie
    const accuracyMap = new Map<string, { correct: number; total: number }>();
    sessionsInRange.forEach(s => {
        const dateStr = new Date(s.createdAt).toISOString().split('T')[0];
        const current = accuracyMap.get(dateStr) || { correct: 0, total: 0 };
        current.total++;
        if (s.isCorrect) current.correct++;
        accuracyMap.set(dateStr, current);
    });

    const accuracyData = activityData.map(d => {
        const stats = accuracyMap.get(d.date);
        return {
            date: d.date,
            accuracy: stats ? (stats.correct / stats.total) * 100 : 0,
            total: stats?.total || 0
        };
    }).filter(d => d.total > 0);

    // 7. Dane dla wykresu poziomów
    const levelMap = new Map<string, { count: number; correct: number }>();
    sessionsInRange.forEach(s => {
        const current = levelMap.get(s.level) || { count: 0, correct: 0 };
        current.count++;
        if (s.isCorrect) current.correct++;
        levelMap.set(s.level, current);
    });

    const levelData = ['A1', 'A2', 'B1', 'B2', 'C1'].map(level => ({
        level,
        count: levelMap.get(level)?.count || 0,
        correct: levelMap.get(level)?.correct || 0,
    }));

    // 8. Dane dla wykresu kategorii
    const categoryMap = new Map<string, { count: number; correct: number }>();
    sessionsInRange.forEach(s => {
        const current = categoryMap.get(s.category) || { count: 0, correct: 0 };
        current.count++;
        if (s.isCorrect) current.correct++;
        categoryMap.set(s.category, current);
    });

    const categoryData = Array.from(categoryMap.entries()).map(([category, data]) => ({
        category,
        count: data.count,
        accuracy: data.count > 0 ? (data.correct / data.count) * 100 : 0,
    }));

    // 9. Dane dla wykresu trybów nauki
    const modeMap = new Map<string, { count: number; correct: number }>();
    sessionsInRange.forEach(s => {
        const current = modeMap.get(s.learningMode) || { count: 0, correct: 0 };
        current.count++;
        if (s.isCorrect) current.correct++;
        modeMap.set(s.learningMode, current);
    });

    const modeData = Object.keys(LEARNING_MODE_LABELS).map(mode => ({
        mode,
        label: LEARNING_MODE_LABELS[mode],
        count: modeMap.get(mode)?.count || 0,
        accuracy: modeMap.get(mode)?.count 
            ? (modeMap.get(mode)!.correct / modeMap.get(mode)!.count) * 100 
            : 0,
    }));

    // 10. Dane dla wykresu czasu nauki
    const timeMap = new Map<string, number>();
    sessionsInRange.forEach(s => {
        const dateStr = new Date(s.createdAt).toISOString().split('T')[0];
        timeMap.set(dateStr, (timeMap.get(dateStr) || 0) + s.timeSpentMs);
    });

    const timeData = activityData.map(d => ({
        date: d.date,
        minutes: (timeMap.get(d.date) || 0) / 1000 / 60,
    }));

    // 11. Dane dla postępu (kumulatywne słówka)
    const wordFirstSeen = new Map<string, string>();
    sessionsInRange.forEach(s => {
        const dateStr = new Date(s.createdAt).toISOString().split('T')[0];
        if (!wordFirstSeen.has(s.wordEnglish) || wordFirstSeen.get(s.wordEnglish)! > dateStr) {
            wordFirstSeen.set(s.wordEnglish, dateStr);
        }
    });

    const newWordsPerDay = new Map<string, number>();
    wordFirstSeen.forEach((date) => {
        newWordsPerDay.set(date, (newWordsPerDay.get(date) || 0) + 1);
    });

    let cumulative = 0;
    const progressData = activityData.map(d => {
        cumulative += newWordsPerDay.get(d.date) || 0;
        return {
            date: d.date,
            learned: newWordsPerDay.get(d.date) || 0,
            cumulative,
        };
    });

    // 12. Najtrudniejsze słówka (najniższa skuteczność z min. 3 próbami)
    const wordStatsMap = new Map<string, { english: string; polish: string; correct: number; total: number }>();
    sessionsInRange.forEach(s => {
        const current = wordStatsMap.get(s.wordEnglish) || { 
            english: s.wordEnglish, 
            polish: s.wordPolish, 
            correct: 0, 
            total: 0 
        };
        current.total++;
        if (s.isCorrect) current.correct++;
        wordStatsMap.set(s.wordEnglish, current);
    });

    const difficultWords = Array.from(wordStatsMap.values())
        .filter(w => w.total >= 3)
        .map(w => ({
            ...w,
            accuracy: (w.correct / w.total) * 100
        }))
        .sort((a, b) => a.accuracy - b.accuracy)
        .slice(0, 5);

    // 13. Najlepiej opanowane słówka
    const masteredWords = Array.from(wordStatsMap.values())
        .filter(w => w.total >= 3)
        .map(w => ({
            ...w,
            accuracy: (w.correct / w.total) * 100
        }))
        .sort((a, b) => b.accuracy - a.accuracy)
        .slice(0, 5);

    // 14. Grupowanie sesji nauki (sesja = ciągła nauka z przerwami < 30 min)
    interface LearningSessionGroup {
        id: number;
        date: Date;
        correct: number;
        incorrect: number;
        total: number;
        accuracy: number;
        durationMs: number;
        levels: Set<string>;
    }

    const sessionGroups: LearningSessionGroup[] = [];
    let currentSession: LearningSessionGroup | null = null;
    const SESSION_GAP_MS = 30 * 60 * 1000; // 30 minut przerwy = nowa sesja

    // Sortuj sesje chronologicznie
    const sortedSessions = [...sessionsInRange].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    sortedSessions.forEach((s, idx) => {
        const sessionTime = new Date(s.createdAt).getTime();
        
        if (!currentSession || sessionTime - new Date(currentSession.date).getTime() > SESSION_GAP_MS) {
            // Rozpocznij nową sesję
            if (currentSession) {
                currentSession.accuracy = currentSession.total > 0 
                    ? (currentSession.correct / currentSession.total) * 100 
                    : 0;
                sessionGroups.push(currentSession);
            }
            currentSession = {
                id: sessionGroups.length + 1,
                date: new Date(s.createdAt),
                correct: s.isCorrect ? 1 : 0,
                incorrect: s.isCorrect ? 0 : 1,
                total: 1,
                accuracy: 0,
                durationMs: s.timeSpentMs,
                levels: new Set([s.level]),
            };
        } else {
            // Kontynuuj bieżącą sesję
            if (s.isCorrect) currentSession.correct++;
            else currentSession.incorrect++;
            currentSession.total++;
            currentSession.durationMs += s.timeSpentMs;
            currentSession.levels.add(s.level);
        }
    });

    // Dodaj ostatnią sesję
    if (currentSession) {
        currentSession.accuracy = currentSession.total > 0 
            ? (currentSession.correct / currentSession.total) * 100 
            : 0;
        sessionGroups.push(currentSession);
    }

    // Odwróć kolejność (najnowsze najpierw)
    const recentSessions = sessionGroups.reverse().slice(0, 15);
    const totalSessionsCount = sessionGroups.length;

    // 15. Dane dla wykresu opanowania (z całej bazy postępu)
    const progressDataAll = await db
        .select({ interval: wordProgress.interval })
        .from(wordProgress)
        .where(eq(wordProgress.userId, userId));

    let newWords = 0;
    let learning = 0;
    let mastered = 0;

    progressDataAll.forEach(p => {
        if (p.interval <= 1) newWords++;
        else if (p.interval <= 21) learning++;
        else mastered++;
    });

    const masteryData = [
        { name: 'Nowe', value: newWords, fill: 'var(--accent-sky)' },
        { name: 'W trakcie', value: learning, fill: 'var(--accent-amber)' },
        { name: 'Opanowane', value: mastered, fill: 'var(--success)' },
    ];

    return (
        <PageLayout
            title="Statystyki"
            description="Szczegółowa analiza Twoich postępów w nauce."
        >
            {/* Filtry czasowe */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <Suspense fallback={<div className="h-9" />}>
                    <StatsFilters />
                </Suspense>
                <p className="text-sm text-muted-foreground">
                    {totalSessions > 0 
                        ? `${totalSessions} odpowiedzi w wybranym okresie`
                        : 'Brak danych w wybranym okresie'
                    }
                </p>
            </div>

            {/* Główne metryki */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-violet-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{uniqueWords}</p>
                                <p className="text-xs text-muted-foreground">Słówek</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                                <Target className="w-5 h-5 text-green-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{accuracy.toFixed(1)}%</p>
                                <p className="text-xs text-muted-foreground">Skuteczność</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                <BarChart3 className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{totalSessions}</p>
                                <p className="text-xs text-muted-foreground">Odpowiedzi</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border-amber-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                                <Clock className="w-5 h-5 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{Math.round(totalTimeMs / 1000 / 60)}</p>
                                <p className="text-xs text-muted-foreground">Minut</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                                <Flame className="w-5 h-5 text-orange-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats?.currentStreak || 0}</p>
                                <p className="text-xs text-muted-foreground">Streak</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-pink-500/10 to-rose-500/10 border-pink-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-pink-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{avgResponseTime.toFixed(1)}s</p>
                                <p className="text-xs text-muted-foreground">Śr. czas</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Wykresy - pierwszy rząd */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-primary" />
                            Aktywność
                        </CardTitle>
                        <CardDescription>Liczba odpowiedzi w kolejnych dniach</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ActivityChart data={activityData} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="w-5 h-5 text-success" />
                            Skuteczność w czasie
                        </CardTitle>
                        <CardDescription>Procent poprawnych odpowiedzi</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AccuracyChart data={accuracyData} />
                    </CardContent>
                </Card>
            </div>

            {/* Wykresy - poziomy CEFR (wyeksponowany) */}
            <Card className="bg-gradient-to-br from-sky-500/5 via-blue-500/5 to-indigo-500/5 border-sky-500/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <BarChart3 className="w-6 h-6 text-accent-sky" />
                        Poziomy CEFR
                    </CardTitle>
                    <CardDescription>Rozkład nauki według poziomów trudności</CardDescription>
                </CardHeader>
                <CardContent>
                    <LevelDistributionChart data={levelData} />
                </CardContent>
            </Card>

            {/* Wykresy - poziom opanowania i tryby nauki */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-violet-500/5 to-purple-500/5 border-violet-500/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChartIcon className="w-5 h-5 text-accent-violet" />
                            Poziom opanowania
                        </CardTitle>
                        <CardDescription>Wszystkie słówka w nauce</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <MasteryChart data={masteryData} />
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-fuchsia-500/5 to-pink-500/5 border-fuchsia-500/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChartIcon className="w-5 h-5 text-accent-fuchsia" />
                            Tryby nauki
                        </CardTitle>
                        <CardDescription>Rozkład według trybu</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <LearningModeChart data={modeData} />
                    </CardContent>
                </Card>
            </div>

            {/* Wykresy - trzeci rząd */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            Postęp nauki
                        </CardTitle>
                        <CardDescription>Kumulatywna liczba poznanych słówek</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ProgressChart data={progressData} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-accent-emerald" />
                            Kategorie
                        </CardTitle>
                        <CardDescription>Najczęściej ćwiczone kategorie</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <CategoryChart data={categoryData} />
                    </CardContent>
                </Card>
            </div>

            {/* Czas nauki */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-accent-amber" />
                        Czas nauki
                    </CardTitle>
                    <CardDescription>Minuty spędzone na nauce każdego dnia</CardDescription>
                </CardHeader>
                <CardContent>
                    <TimeChart data={timeData} />
                </CardContent>
            </Card>

            {/* Słówka - trudne i opanowane */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-error" />
                            Najtrudniejsze słówka
                        </CardTitle>
                        <CardDescription>Słówka z najniższą skutecznością (min. 3 próby)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DifficultWords 
                            words={difficultWords} 
                            title="Najtrudniejsze"
                            emptyMessage="Brak wystarczających danych (min. 3 próby na słówko)"
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Award className="w-5 h-5 text-success" />
                            Najlepiej opanowane
                        </CardTitle>
                        <CardDescription>Słówka z najwyższą skutecznością (min. 3 próby)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DifficultWords 
                            words={masteredWords} 
                            title="Najlepsze"
                            emptyMessage="Brak wystarczających danych (min. 3 próby na słówko)"
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Historia sesji */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <History className="w-5 h-5 text-accent-violet" />
                                Historia sesji nauki
                            </CardTitle>
                            <CardDescription>
                                Szczegółowy podział na poszczególne sesje ({totalSessionsCount} sesji w wybranym okresie)
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1.5">
                                <CheckCircle className="w-4 h-4 text-success" />
                                <span className="font-medium">{correctAnswers}</span>
                                <span className="text-muted-foreground">poprawnych</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <XCircle className="w-4 h-4 text-error" />
                                <span className="font-medium">{totalSessions - correctAnswers}</span>
                                <span className="text-muted-foreground">błędnych</span>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {recentSessions.length > 0 ? (
                        <div className="space-y-3">
                            {recentSessions.map((session) => (
                                <div 
                                    key={session.id} 
                                    className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-accent-violet/10 flex items-center justify-center">
                                            <CalendarDays className="w-5 h-5 text-accent-violet" />
                                        </div>
                                        <div>
                                            <p className="font-medium">
                                                {session.date.toLocaleDateString('pl-PL', { 
                                                    weekday: 'long',
                                                    day: 'numeric', 
                                                    month: 'long',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <span>{session.total} słówek</span>
                                                <span>•</span>
                                                <span>{Math.round(session.durationMs / 1000 / 60)} min</span>
                                                <span>•</span>
                                                <div className="flex gap-1">
                                                    {Array.from(session.levels).map(level => (
                                                        <Badge key={level} variant="outline" className="text-xs px-1.5 py-0">
                                                            {level}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1.5 text-success">
                                                <CheckCircle className="w-4 h-4" />
                                                <span className="font-semibold">{session.correct}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-error">
                                                <XCircle className="w-4 h-4" />
                                                <span className="font-semibold">{session.incorrect}</span>
                                            </div>
                                        </div>
                                        <div className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
                                            session.accuracy >= 80 
                                                ? 'bg-success/10 text-success' 
                                                : session.accuracy >= 60 
                                                    ? 'bg-warning/10 text-warning' 
                                                    : 'bg-error/10 text-error'
                                        }`}>
                                            {session.accuracy.toFixed(0)}%
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {totalSessionsCount > 15 && (
                                <p className="text-center text-sm text-muted-foreground pt-2">
                                    Pokazano ostatnie 15 sesji z {totalSessionsCount}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>Brak sesji nauki w wybranym okresie</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Statystyki ogólne (całkowite) */}
            <Card className="bg-gradient-to-r from-primary/5 via-accent-violet/5 to-accent-fuchsia/5">
                <CardHeader>
                    <CardTitle>Statystyki całkowite</CardTitle>
                    <CardDescription>Wszystkie Twoje postępy od początku</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-primary">{stats?.totalWordsLearned || 0}</p>
                            <p className="text-sm text-muted-foreground">Łącznie słówek</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-bold text-accent-amber">{Math.round((stats?.totalTimeMs || 0) / 1000 / 60)}</p>
                            <p className="text-sm text-muted-foreground">Minut nauki</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-bold text-accent-orange">{stats?.longestStreak || 0}</p>
                            <p className="text-sm text-muted-foreground">Najdłuższy streak</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-bold text-success">{mastered}</p>
                            <p className="text-sm text-muted-foreground">Opanowanych</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </PageLayout>
    );
}
