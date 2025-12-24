import { auth } from '@/lib/auth';
import { db } from '@/lib/db/drizzle';
import { wordProgress, words } from '@/lib/db/schema';
import { eq, desc, or, ilike, and } from 'drizzle-orm';
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
import { PageLayout } from '@/components/page-layout';
import { Search } from '@/components/search';

interface MyWordsPageProps {
    searchParams: Promise<{
        query?: string;
    }>;
}

export default async function MyWordsPage(props: MyWordsPageProps) {
    const searchParams = await props.searchParams;
    const query = searchParams.query || '';
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        redirect('/login');
    }

    // Buduj warunki filtrowania
    const filters = [eq(wordProgress.userId, session.user.id)];
    
    if (query) {
        filters.push(or(
            ilike(words.english, `%${query}%`),
            ilike(words.polish, `%${query}%`)
        )!);
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
        .where(and(...filters))
        .orderBy(desc(wordProgress.lastReviewed));

    if (userProgress.length === 0) {
        return (
            <PageLayout>
                <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
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
            </PageLayout>
        )
    }

    return (
        <PageLayout
            title="Moje Postępy"
            description={`Słówka, których się uczysz i ich status. ${userProgress.length} ${userProgress.length === 1 ? 'słówko' : userProgress.length < 5 ? 'słówka' : 'słówek'}`}
            actions={
                <>
                    <ImportWordsDialog />
                    <AddWordDialog />
                </>
            }
        >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex-1 min-w-0">
                    <Search placeholder="Szukaj słówka..." />
                </div>
            </div>

            <div className="rounded-md border bg-white dark:bg-card">
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
        </PageLayout>
    );
}
