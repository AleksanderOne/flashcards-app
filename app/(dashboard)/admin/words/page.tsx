import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { FixCategoriesCard } from '../_components/fix-categories-card';
import { WordsManagementCard } from './_components/words-management-card';

export default async function AdminWordsPage() {
    const session = await auth();

    if (!session || !session.user || session.user.role !== 'admin') {
        redirect('/');
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Zarządzanie Słówkami</h1>
                <p className="text-muted-foreground mt-2">
                    Narzędzia administracyjne do zarządzania bazą słówek
                </p>
            </div>

            <div className="grid gap-6">
                <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-muted" />}>
                    <WordsManagementCard />
                </Suspense>

                <FixCategoriesCard />
            </div>
        </div>
    );
}
