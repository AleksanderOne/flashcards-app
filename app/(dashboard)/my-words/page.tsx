import { auth } from '@/lib/auth';
import { db } from '@/lib/db/drizzle';
import { wordProgress, words } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { formatDistanceToNow, isPast } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AddWordDialog } from '@/components/add-word-dialog';
import { ImportWordsDialog } from '@/components/import-words-dialog';

export default async function MyWordsPage() {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        redirect('/login');
    }

    const userProgress = await db
        .select({
            english: wordProgress.wordEnglish,
            polish: words.polish, // Join to get translation
            repetitions: wordProgress.repetitions,
            interval: wordProgress.interval,
            nextReview: wordProgress.nextReviewDate,
            easiness: wordProgress.easinessFactor,
            image: words.imageUrl
        })
        .from(wordProgress)
        .innerJoin(words, eq(wordProgress.wordEnglish, words.english))
        .where(eq(wordProgress.userId, session.user.id))
        .orderBy(desc(wordProgress.lastReviewed));

    if (userProgress.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 space-y-4">
                <h2 className="text-2xl font-bold">Jeszcze nic nie umiesz? 😉</h2>
                <p className="text-muted-foreground text-center max-w-md">
                    Rozpocznij swoją pierwszą sesję nauki, aby zobaczyć tutaj postępy.
                </p>
                <div className="flex gap-4">
                    <a href="/learn" className="px-6 py-3 bg-primary text-primary-foreground rounded-lg">
                        Zacznij naukę
                    </a>
                    <AddWordDialog />
                    <ImportWordsDialog />
                </div>
            </div>
        )
    }

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Moje Postępy</h2>
                    <p className="text-muted-foreground">Słówka, których się uczysz i ich status.</p>
                </div>
                <div className="flex gap-2">
                    <ImportWordsDialog />
                    <AddWordDialog />
                </div>
            </div>

            <div className="rounded-md border bg-white dark:bg-black">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Słówko</TableHead>
                            <TableHead>Tłumaczenie</TableHead>
                            <TableHead>Powtórki</TableHead>
                            <TableHead>Następna powtórka</TableHead>
                            <TableHead>Stan wiedzy</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {userProgress.map((item) => {
                            const isDue = item.nextReview && isPast(new Date(item.nextReview));
                            return (
                                <TableRow key={item.english}>
                                    <TableCell className="font-bold">{item.english}</TableCell>
                                    <TableCell>{item.polish}</TableCell>
                                    <TableCell>{item.repetitions}</TableCell>
                                    <TableCell>
                                        {item.nextReview ? (
                                            <span className={cn(isDue && "text-amber-600 font-bold")}>
                                                {isDue
                                                    ? "Teraz"
                                                    : formatDistanceToNow(new Date(item.nextReview), { locale: pl, addSuffix: true })
                                                }
                                            </span>
                                        ) : "-"}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={item.interval > 21 ? "default" : item.interval > 3 ? "secondary" : "outline"}>
                                            {item.interval > 21 ? "Pamiętam" : item.interval > 3 ? "Uczę się" : "Nowe"}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
