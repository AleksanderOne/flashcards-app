import { db } from '@/lib/db/drizzle';
import { achievements, userStats } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Typy osiągnięć
export type AchievementType = 'words_learned' | 'streak' | 'sessions' | 'accuracy' | 'special';
export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    threshold: number;
    type: AchievementType;
    rarity: AchievementRarity;
    category: string;
    points: number;
}

// Kolory dla rzadkości
export const RARITY_COLORS = {
    common: {
        bg: 'from-slate-100 to-gray-100 dark:from-slate-900 dark:to-gray-900',
        border: 'border-slate-300 dark:border-slate-700',
        text: 'text-slate-600 dark:text-slate-400',
        badge: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        glow: ''
    },
    uncommon: {
        bg: 'from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30',
        border: 'border-green-300 dark:border-green-800',
        text: 'text-green-600 dark:text-green-400',
        badge: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
        glow: 'shadow-green-500/20'
    },
    rare: {
        bg: 'from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30',
        border: 'border-blue-300 dark:border-blue-800',
        text: 'text-blue-600 dark:text-blue-400',
        badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
        glow: 'shadow-blue-500/20'
    },
    epic: {
        bg: 'from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30',
        border: 'border-violet-400 dark:border-violet-700',
        text: 'text-violet-600 dark:text-violet-400',
        badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300',
        glow: 'shadow-violet-500/30'
    },
    legendary: {
        bg: 'from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/30 dark:via-yellow-950/30 dark:to-orange-950/30',
        border: 'border-amber-400 dark:border-amber-600',
        text: 'text-amber-600 dark:text-amber-400',
        badge: 'bg-gradient-to-r from-amber-200 to-yellow-200 text-amber-800 dark:from-amber-800 dark:to-yellow-800 dark:text-amber-200',
        glow: 'shadow-amber-500/40'
    }
};

export const RARITY_LABELS = {
    common: 'Zwykłe',
    uncommon: 'Niepospolite',
    rare: 'Rzadkie',
    epic: 'Epickie',
    legendary: 'Legendarne'
};

export const ACHIEVEMENTS_LIST: Achievement[] = [
    // ==================== SŁÓWKA ====================
    {
        id: 'first_10_words',
        title: 'Pierwsze Kroki',
        description: 'Naucz się pierwszych 10 słówek',
        icon: 'Sprout',
        threshold: 10,
        type: 'words_learned',
        rarity: 'common',
        category: 'Słownictwo',
        points: 10
    },
    {
        id: 'words_25',
        title: 'Początkujący',
        description: 'Naucz się 25 słówek',
        icon: 'BookOpen',
        threshold: 25,
        type: 'words_learned',
        rarity: 'common',
        category: 'Słownictwo',
        points: 25
    },
    {
        id: 'words_50',
        title: 'Uczeń',
        description: 'Naucz się 50 słówek',
        icon: 'GraduationCap',
        threshold: 50,
        type: 'words_learned',
        rarity: 'uncommon',
        category: 'Słownictwo',
        points: 50
    },
    {
        id: 'vocabulary_master_100',
        title: 'Mistrz Słów',
        description: 'Naucz się 100 słówek',
        icon: 'Award',
        threshold: 100,
        type: 'words_learned',
        rarity: 'uncommon',
        category: 'Słownictwo',
        points: 100
    },
    {
        id: 'words_250',
        title: 'Lingwista',
        description: 'Naucz się 250 słówek',
        icon: 'Languages',
        threshold: 250,
        type: 'words_learned',
        rarity: 'rare',
        category: 'Słownictwo',
        points: 250
    },
    {
        id: 'words_500',
        title: 'Poliglota',
        description: 'Naucz się 500 słówek',
        icon: 'Globe',
        threshold: 500,
        type: 'words_learned',
        rarity: 'epic',
        category: 'Słownictwo',
        points: 500
    },
    {
        id: 'words_1000',
        title: 'Encyklopedysta',
        description: 'Naucz się 1000 słówek',
        icon: 'Library',
        threshold: 1000,
        type: 'words_learned',
        rarity: 'legendary',
        category: 'Słownictwo',
        points: 1000
    },

    // ==================== STREAK ====================
    {
        id: 'streak_3_days',
        title: 'Systematyczność',
        description: 'Utrzymaj streak przez 3 dni',
        icon: 'Flame',
        threshold: 3,
        type: 'streak',
        rarity: 'common',
        category: 'Streak',
        points: 30
    },
    {
        id: 'streak_7_days',
        title: 'Tydzień Nauki',
        description: 'Utrzymaj streak przez 7 dni',
        icon: 'Zap',
        threshold: 7,
        type: 'streak',
        rarity: 'uncommon',
        category: 'Streak',
        points: 70
    },
    {
        id: 'streak_14_days',
        title: 'Dwutygodniowiec',
        description: 'Utrzymaj streak przez 14 dni',
        icon: 'Timer',
        threshold: 14,
        type: 'streak',
        rarity: 'rare',
        category: 'Streak',
        points: 140
    },
    {
        id: 'streak_30_days',
        title: 'Miesiąc Wytrwałości',
        description: 'Utrzymaj streak przez 30 dni',
        icon: 'Calendar',
        threshold: 30,
        type: 'streak',
        rarity: 'epic',
        category: 'Streak',
        points: 300
    },
    {
        id: 'streak_60_days',
        title: 'Wojownik Nauki',
        description: 'Utrzymaj streak przez 60 dni',
        icon: 'Sword',
        threshold: 60,
        type: 'streak',
        rarity: 'epic',
        category: 'Streak',
        points: 600
    },
    {
        id: 'streak_100_days',
        title: 'Legenda',
        description: 'Utrzymaj streak przez 100 dni',
        icon: 'Crown',
        threshold: 100,
        type: 'streak',
        rarity: 'legendary',
        category: 'Streak',
        points: 1000
    },

    // ==================== SESJE ====================
    {
        id: 'first_session',
        title: 'Pierwszy Raz',
        description: 'Ukończ swoją pierwszą sesję nauki',
        icon: 'Play',
        threshold: 1,
        type: 'sessions',
        rarity: 'common',
        category: 'Aktywność',
        points: 5
    },
    {
        id: 'sessions_10',
        title: 'Regularny Uczeń',
        description: 'Ukończ 10 sesji nauki',
        icon: 'Repeat',
        threshold: 10,
        type: 'sessions',
        rarity: 'common',
        category: 'Aktywność',
        points: 20
    },
    {
        id: 'sessions_25',
        title: 'Wytrwały',
        description: 'Ukończ 25 sesji nauki',
        icon: 'TrendingUp',
        threshold: 25,
        type: 'sessions',
        rarity: 'uncommon',
        category: 'Aktywność',
        points: 50
    },
    {
        id: 'sessions_50',
        title: 'Ambitny',
        description: 'Ukończ 50 sesji nauki',
        icon: 'Target',
        threshold: 50,
        type: 'sessions',
        rarity: 'rare',
        category: 'Aktywność',
        points: 100
    },
    {
        id: 'sessions_100',
        title: 'Niestrudzony',
        description: 'Ukończ 100 sesji nauki',
        icon: 'Rocket',
        threshold: 100,
        type: 'sessions',
        rarity: 'epic',
        category: 'Aktywność',
        points: 200
    },
    {
        id: 'sessions_250',
        title: 'Maszyna do Nauki',
        description: 'Ukończ 250 sesji nauki',
        icon: 'Cpu',
        threshold: 250,
        type: 'sessions',
        rarity: 'legendary',
        category: 'Aktywność',
        points: 500
    },

    // ==================== SPECJALNE ====================
    {
        id: 'night_owl',
        title: 'Nocny Marek',
        description: 'Ucz się po północy',
        icon: 'Moon',
        threshold: 1,
        type: 'special',
        rarity: 'rare',
        category: 'Specjalne',
        points: 50
    },
    {
        id: 'early_bird',
        title: 'Ranny Ptaszek',
        description: 'Ucz się przed 6 rano',
        icon: 'Sunrise',
        threshold: 1,
        type: 'special',
        rarity: 'rare',
        category: 'Specjalne',
        points: 50
    },
    {
        id: 'weekend_warrior',
        title: 'Weekendowy Wojownik',
        description: 'Ucz się w sobotę i niedzielę',
        icon: 'Shield',
        threshold: 1,
        type: 'special',
        rarity: 'uncommon',
        category: 'Specjalne',
        points: 30
    },
    {
        id: 'perfectionist',
        title: 'Perfekcjonista',
        description: 'Ukończ sesję bez błędów (min. 10 słówek)',
        icon: 'Star',
        threshold: 1,
        type: 'special',
        rarity: 'epic',
        category: 'Specjalne',
        points: 100
    },
];

// Grupowanie osiągnięć po kategorii
export const ACHIEVEMENT_CATEGORIES = [...new Set(ACHIEVEMENTS_LIST.map(a => a.category))];

export async function checkAndUnlockAchievements(userId: string) {
    const stats = await db.query.userStats.findFirst({
        where: eq(userStats.userId, userId),
    });

    if (!stats) return;

    const userAchievements = await db.query.achievements.findMany({
        where: eq(achievements.userId, userId),
    });

    const unlockedIds = new Set(userAchievements.map(a => a.type));

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
        } else if (achievement.type === 'sessions') {
            if (stats.totalSessions >= achievement.threshold) {
                unlocked = true;
            }
        }
        // Osiągnięcia specjalne są odblokowywane w innych miejscach kodu

        if (unlocked) {
            await db.insert(achievements).values({
                userId,
                type: achievement.id,
                category: 'general',
                metadata: { unlockedAt: new Date() },
            });
            newUnlocks.push(achievement.title);
        }
    }

    return newUnlocks;
}

// Oblicz sumę punktów za osiągnięcia
export function calculateTotalPoints(unlockedIds: string[]): number {
    return ACHIEVEMENTS_LIST
        .filter(a => unlockedIds.includes(a.id))
        .reduce((sum, a) => sum + a.points, 0);
}

// Oblicz postęp do następnego osiągnięcia
export function getNextAchievement(type: AchievementType, currentValue: number): Achievement | null {
    const typeAchievements = ACHIEVEMENTS_LIST
        .filter(a => a.type === type)
        .sort((a, b) => a.threshold - b.threshold);
    
    return typeAchievements.find(a => a.threshold > currentValue) || null;
}
