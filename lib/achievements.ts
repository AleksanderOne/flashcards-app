import { db } from '@/lib/db/drizzle';
import { achievements, userStats } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { Trophy, Flame, Zap, Target, BookOpen } from 'lucide-react';

export const ACHIEVEMENTS_LIST = [
    {
        id: 'first_10_words',
        title: 'Pierwsze Kroki',
        description: 'Naucz się pierwszych 10 słówek',
        icon: 'BookOpen',
        threshold: 10,
        type: 'words_learned'
    },
    {
        id: 'vocabulary_master_100',
        title: 'Mistrz Słów',
        description: 'Naucz się 100 słówek',
        icon: 'Trophy',
        threshold: 100,
        type: 'words_learned'
    },
    {
        id: 'streak_3_days',
        title: 'Systematyczność',
        description: 'Utrzymaj streak przez 3 dni',
        icon: 'Flame',
        threshold: 3,
        type: 'streak'
    },
    {
        id: 'streak_7_days',
        title: 'Tydzień Nauki',
        description: 'Utrzymaj streak przez 7 dni',
        icon: 'Zap',
        threshold: 7,
        type: 'streak'
    },
    // Przyszłościowo: Osiągnięcia per kategoria
];

export async function checkAndUnlockAchievements(userId: string) {
    const stats = await db.query.userStats.findFirst({
        where: eq(userStats.userId, userId),
    });

    if (!stats) return;

    const userAchievements = await db.query.achievements.findMany({
        where: eq(achievements.userId, userId),
    });

    const unlockedIds = new Set(userAchievements.map(a => a.type));
    // Uwaga: Schemat używa pola 'type' jako identyfikatora osiągnięcia. Zachowano dla wstecznej kompatybilności.
    // Schemat: type, level, category. Używamy 'type' do przechowywania ID osiągnięcia dla uproszczenia (uniknięcie migracji schematu).

    const newUnlocks: string[] = [];

    for (const achievement of ACHIEVEMENTS_LIST) {
        if (unlockedIds.has(achievement.id)) continue;

        let unlocked = false;

        if (achievement.type === 'words_learned') {
            if (stats.totalWordsLearned >= achievement.threshold) {
                unlocked = true;
            }
        } else if (achievement.type === 'streak') {
            if (stats.currentStreak >= achievement.threshold) {
                unlocked = true;
            }
        }

        if (unlocked) {
            await db.insert(achievements).values({
                userId,
                type: achievement.id, // Przechowywanie ID w kolumnie 'type'
                category: 'general',
                metadata: { unlockedAt: new Date() },
            });
            newUnlocks.push(achievement.title);
        }
    }

    return newUnlocks;
}
