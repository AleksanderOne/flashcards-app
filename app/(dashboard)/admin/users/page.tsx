import { auth } from '@/lib/auth';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { redirect } from 'next/navigation';
import { UsersTable } from './users-table';
import { desc } from 'drizzle-orm';
import { PageLayout } from '@/components/page-layout';
import { AdminNav } from '../_components/admin-nav';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
    const session = await auth();
    if (!session?.user?.email) redirect('/login');

    if (session.user.role !== 'admin') {
        redirect('/learn');
    }

    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));

    return (
        <PageLayout
            title="Panel Administratora"
            description="Zarządzaj użytkownikami i uprawnieniami."
            actions={<AdminNav />}
        >
            <UsersTable users={allUsers} />
        </PageLayout>
    );
}
