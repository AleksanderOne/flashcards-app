import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { FixCategoriesCard } from '../_components/fix-categories-card';
import { WordsManagementCard } from './_components/words-management-card';
import { PageLayout } from '@/components/page-layout';
import { AdminNav } from '../_components/admin-nav';

export const dynamic = 'force-dynamic';

export default async function AdminWordsPage() {
    const session = await auth();

    if (!session || !session.user || session.user.role !== 'admin') {
        redirect('/');
    }

    return (
        <PageLayout
            title="Zarządzanie Słówkami"
            description="Narzędzia administracyjne do zarządzania bazą słówek"
            actions={<AdminNav />}
        >
            <div className="grid gap-6">
                <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-muted" />}>
                    <WordsManagementCard />
                </Suspense>

                <FixCategoriesCard />
            </div>
        </PageLayout>
    );
}
