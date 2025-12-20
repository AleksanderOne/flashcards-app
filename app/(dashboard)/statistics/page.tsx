import { auth } from '@/lib/auth';
import { db } from '@/lib/db/drizzle';

import { eq, sql, gte } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityChart } from '@/app/(dashboard)/statistics/_components/activity-chart';
import { MasteryChart } from '@/app/(dashboard)/statistics/_components/mastery-chart';
import { StatsCard } from '../learn/_components/stats-card'; // Reuse
import { userStats, learningSessions, wordProgress } from '@/lib/db/schema';

export default async function StatisticsPage() {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        redirect('/login');
    }
    const userId = session.user.id;

    // 1. Pobierz ogólne statystyki (z dashboardu)
    const stats = await db.query.userStats.findFirst({
        where: eq(userStats.userId, userId),
    });

    // 2. Pobierz dane aktywności (ostatnie 7 dni)
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 6);
    last7Days.setHours(0, 0, 0, 0);

    const activityDataResult = await db
        .select({
            date: sql<string>`to_char(${learningSessions.createdAt}, 'YYYY-MM-DD')`,
            count: sql<number>`count(*)`,
        })
        .from(learningSessions)
        .where(
            sql`${learningSessions.userId} = ${userId} AND ${learningSessions.createdAt} >= ${last7Days.toISOString()}`
        )
        .groupBy(sql`to_char(${learningSessions.createdAt}, 'YYYY-MM-DD')`)
        .orderBy(sql`to_char(${learningSessions.createdAt}, 'YYYY-MM-DD')`);

    // Fill zero days
    const activityData: { date: string, count: number }[] = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toISOString().split('T')[0];
        const found = activityDataResult.find(r => r.date === dateStr);
        activityData.push({
            date: dateStr,
            count: Number(found?.count || 0)
        });
    }

    // 3. Pobierz dane Mastery
    const progressData = await db
        .select({
            interval: wordProgress.interval
        })
        .from(wordProgress)
        .where(eq(wordProgress.userId, userId));

    let newWords = 0;
    let learning = 0;
    let mastered = 0;

    progressData.forEach(p => {
        if (p.interval <= 1) newWords++;
        else if (p.interval <= 21) learning++;
        else mastered++;
    });

    const masteryData = [
        { name: 'Nowe', value: newWords, fill: '#8884d8' },
        { name: 'W trakcie', value: learning, fill: '#82ca9d' },
        { name: 'Opanowane', value: mastered, fill: '#ffc658' },
    ];

    return (
        <div className="p-8 space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Statystyki</h2>
                <p className="text-muted-foreground">Szczegółowa analiza Twoich postępów.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <StatsCard
                    label="Najdłuższy Streak"
                    value={stats?.longestStreak || 0}
                    icon="🔥"
                    subtext="dni"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Aktywność (Ost. 7 dni)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ActivityChart data={activityData} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Poziom Opanowania</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <MasteryChart data={masteryData} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
