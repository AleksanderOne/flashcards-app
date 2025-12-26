import { auth } from '@/lib/auth';
import { db } from '@/lib/db/drizzle';
import { achievements, userStats } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { 
    ACHIEVEMENTS_LIST, 
    ACHIEVEMENT_CATEGORIES, 
    RARITY_COLORS, 
    RARITY_LABELS,
    calculateTotalPoints,
    type Achievement
} from '@/lib/achievements';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
    Trophy, Flame, Zap, BookOpen, Lock, Crown, Star, Target,
    Sprout, GraduationCap, Award, Languages, Globe, Library,
    Timer, Calendar, Sword, Play, Repeat, TrendingUp, Rocket, Cpu,
    Moon, Sunrise, Shield, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { PageLayout } from '@/components/page-layout';

// Mapowanie ikon
const Icons: Record<string, any> = {
    Trophy, Flame, Zap, BookOpen, Crown, Star, Target,
    Sprout, GraduationCap, Award, Languages, Globe, Library,
    Timer, Calendar, Sword, Play, Repeat, TrendingUp, Rocket, Cpu,
    Moon, Sunrise, Shield, Sparkles
};

// Ikony kategorii
const CategoryIcons: Record<string, any> = {
    'Słownictwo': BookOpen,
    'Streak': Flame,
    'Aktywność': Target,
    'Specjalne': Star
};

export default async function AchievementsPage() {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        redirect('/login');
    }

    // Pobierz odblokowane osiągnięcia
    const userAchievements = await db.query.achievements.findMany({
        where: eq(achievements.userId, session.user.id),
    });

    // Pobierz statystyki użytkownika
    const stats = await db.query.userStats.findFirst({
        where: eq(userStats.userId, session.user.id),
    });

    const unlockedMap = new Map(userAchievements.map(a => [a.type, a]));
    const unlockedIds = userAchievements.map(a => a.type);
    const totalPoints = calculateTotalPoints(unlockedIds);
    const maxPoints = ACHIEVEMENTS_LIST.reduce((sum, a) => sum + a.points, 0);
    const unlockedCount = unlockedIds.length;
    const totalCount = ACHIEVEMENTS_LIST.length;

    // Grupuj osiągnięcia po kategorii
    const achievementsByCategory = ACHIEVEMENT_CATEGORIES.map(category => ({
        category,
        achievements: ACHIEVEMENTS_LIST.filter(a => a.category === category)
    }));

    // Funkcja do obliczenia postępu
    const getProgress = (achievement: Achievement): number => {
        if (!stats) return 0;
        let current = 0;
        switch (achievement.type) {
            case 'words_learned':
                current = stats.totalWordsLearned;
                break;
            case 'streak':
                current = stats.currentStreak;
                break;
            case 'sessions':
                current = stats.totalSessions;
                break;
            default:
                return 0;
        }
        return Math.min((current / achievement.threshold) * 100, 100);
    };

    const getCurrentValue = (achievement: Achievement): number => {
        if (!stats) return 0;
        switch (achievement.type) {
            case 'words_learned':
                return stats.totalWordsLearned;
            case 'streak':
                return stats.currentStreak;
            case 'sessions':
                return stats.totalSessions;
            default:
                return 0;
        }
    };

    return (
        <PageLayout
            title="Osiągnięcia"
            description="Zdobywaj odznaki za swoje postępy w nauce i zbieraj punkty!"
        >
            <div className="space-y-8">
                {/* Statystyki ogólne */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg">
                                    <Trophy className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-amber-700 dark:text-amber-300">{unlockedCount}</div>
                                    <div className="text-sm text-amber-600/70 dark:text-amber-400/70">z {totalCount} odznak</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-2 border-violet-200 dark:border-violet-800 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                                    <Sparkles className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-violet-700 dark:text-violet-300">{totalPoints}</div>
                                    <div className="text-sm text-violet-600/70 dark:text-violet-400/70">punktów zdobytych</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-2 border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
                                    <Flame className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-orange-700 dark:text-orange-300">{stats?.currentStreak || 0}</div>
                                    <div className="text-sm text-orange-600/70 dark:text-orange-400/70">dni streak</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                                    <Target className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-green-700 dark:text-green-300">{Math.round((unlockedCount / totalCount) * 100)}%</div>
                                    <div className="text-sm text-green-600/70 dark:text-green-400/70">ukończono</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Pasek postępu ogólnego */}
                <Card className="border-2">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-3">
                            <span className="font-semibold">Postęp kolekcji</span>
                            <span className="text-sm text-muted-foreground">{totalPoints} / {maxPoints} pkt</span>
                        </div>
                        <Progress value={(totalPoints / maxPoints) * 100} className="h-3" />
                    </CardContent>
                </Card>

                {/* Osiągnięcia po kategoriach */}
                {achievementsByCategory.map(({ category, achievements: categoryAchievements }) => {
                    const CategoryIcon = CategoryIcons[category] || Trophy;
                    const categoryUnlocked = categoryAchievements.filter(a => unlockedMap.has(a.id)).length;
                    
                    return (
                        <div key={category} className="space-y-4">
                            {/* Nagłówek kategorii */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                                    <CategoryIcon className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold">{category}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {categoryUnlocked} z {categoryAchievements.length} zdobytych
                                    </p>
                                </div>
                            </div>

                            {/* Siatka osiągnięć */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                                {categoryAchievements.map((achievement) => {
                                    const unlockedData = unlockedMap.get(achievement.id);
                                    const isUnlocked = !!unlockedData;
                                    const IconComponent = Icons[achievement.icon] || Trophy;
                                    const rarityStyle = RARITY_COLORS[achievement.rarity];
                                    const progress = getProgress(achievement);
                                    const currentValue = getCurrentValue(achievement);

                                    return (
                                        <Card
                                            key={achievement.id}
                                            className={cn(
                                                "relative overflow-hidden transition-all duration-300 border-2 group hover:scale-[1.02]",
                                                isUnlocked
                                                    ? cn(
                                                        `bg-gradient-to-br ${rarityStyle.bg}`,
                                                        rarityStyle.border,
                                                        `shadow-lg ${rarityStyle.glow}`
                                                    )
                                                    : "border-dashed border-muted bg-muted/30 opacity-70"
                                            )}
                                        >
                                            {/* Efekt świecenia dla legendarnych */}
                                            {isUnlocked && achievement.rarity === 'legendary' && (
                                                <div className="absolute inset-0 bg-gradient-to-r from-amber-400/10 via-yellow-400/20 to-amber-400/10 animate-pulse" />
                                            )}

                                            <CardContent className="p-5 relative">
                                                <div className="flex items-start gap-4">
                                                    {/* Ikona */}
                                                    <div className={cn(
                                                        "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                                                        isUnlocked
                                                            ? achievement.rarity === 'legendary'
                                                                ? "bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-400 text-white shadow-lg"
                                                                : achievement.rarity === 'epic'
                                                                    ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg"
                                                                    : achievement.rarity === 'rare'
                                                                        ? "bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg"
                                                                        : achievement.rarity === 'uncommon'
                                                                            ? "bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-lg"
                                                                            : "bg-gradient-to-br from-slate-400 to-gray-500 text-white"
                                                            : "bg-muted text-muted-foreground"
                                                    )}>
                                                        {isUnlocked ? (
                                                            <IconComponent className="w-7 h-7" />
                                                        ) : (
                                                            <Lock className="w-6 h-6" />
                                                        )}
                                                    </div>

                                                    {/* Treść */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <h4 className={cn(
                                                                "font-bold text-base",
                                                                !isUnlocked && "text-muted-foreground"
                                                            )}>
                                                                {achievement.title}
                                                            </h4>
                                                            <Badge 
                                                                variant="secondary" 
                                                                className={cn(
                                                                    "text-xs shrink-0",
                                                                    isUnlocked ? rarityStyle.badge : "bg-muted text-muted-foreground"
                                                                )}
                                                            >
                                                                {isUnlocked ? `+${achievement.points}` : RARITY_LABELS[achievement.rarity]}
                                                            </Badge>
                                                        </div>
                                                        <p className={cn(
                                                            "text-sm mt-1",
                                                            isUnlocked ? "text-muted-foreground" : "text-muted-foreground/70"
                                                        )}>
                                                            {achievement.description}
                                                        </p>

                                                        {/* Pasek postępu lub data zdobycia */}
                                                        {isUnlocked ? (
                                                            unlockedData?.createdAt && (
                                                                <p className={cn("text-xs mt-3 font-medium", rarityStyle.text)}>
                                                                    ✓ Zdobyto {format(new Date(unlockedData.createdAt), 'd MMM yyyy', { locale: pl })}
                                                                </p>
                                                            )
                                                        ) : achievement.type !== 'special' && (
                                                            <div className="mt-3">
                                                                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                                                    <span>Postęp</span>
                                                                    <span>{currentValue} / {achievement.threshold}</span>
                                                                </div>
                                                                <Progress value={progress} className="h-1.5" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}

                {/* Legenda rzadkości */}
                <Card className="border-2">
                    <CardContent className="p-6">
                        <h4 className="font-semibold mb-4">Legenda rzadkości</h4>
                        <div className="flex flex-wrap gap-3">
                            {Object.entries(RARITY_LABELS).map(([key, label]) => (
                                <Badge 
                                    key={key} 
                                    variant="secondary"
                                    className={cn("text-sm py-1.5 px-3", RARITY_COLORS[key as keyof typeof RARITY_COLORS].badge)}
                                >
                                    {label}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </PageLayout>
    );
}
