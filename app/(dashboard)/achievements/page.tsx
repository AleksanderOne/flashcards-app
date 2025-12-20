import { auth } from '@/lib/auth';
import { db } from '@/lib/db/drizzle';
import { achievements } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { ACHIEVEMENTS_LIST } from '@/lib/achievements';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Flame, Zap, BookOpen, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

// Icon mapping
const Icons: Record<string, any> = {
    Trophy,
    Flame,
    Zap,
    BookOpen
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

    const unlockedMap = new Map(userAchievements.map(a => [a.type, a])); // a.type holds achievement ID

    return (
        <div className="p-8 space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Osiągnięcia</h2>
                <p className="text-muted-foreground">Zdobywaj odznaki za swoje postępy w nauce.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ACHIEVEMENTS_LIST.map((achievement) => {
                    const unlockedData = unlockedMap.get(achievement.id);
                    const isUnlocked = !!unlockedData;
                    const IconComponent = Icons[achievement.icon] || Trophy;

                    return (
                        <Card
                            key={achievement.id}
                            className={cn(
                                "transition-all duration-300 border-2",
                                isUnlocked
                                    ? "border-yellow-500/50 bg-gradient-to-br from-yellow-50/50 to-orange-50/50 dark:from-yellow-900/10 dark:to-orange-900/10 shadow-lg shadow-yellow-500/10"
                                    : "border-dashed border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 opacity-70 grayscale"
                            )}
                        >
                            <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                <div className={cn(
                                    "p-3 rounded-full",
                                    isUnlocked ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400" : "bg-gray-200 text-gray-500 dark:bg-gray-800"
                                )}>
                                    {isUnlocked ? <IconComponent className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                                </div>
                                <div>
                                    <CardTitle className={cn(!isUnlocked && "text-muted-foreground")}>
                                        {achievement.title}
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="text-sm">
                                    {achievement.description}
                                </CardDescription>
                                {isUnlocked && unlockedData?.createdAt && (
                                    <p className="text-xs text-yellow-600/80 dark:text-yellow-500/60 mt-4 font-medium">
                                        Zdobyto: {format(new Date(unlockedData.createdAt), 'd MMMM yyyy', { locale: pl })}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
