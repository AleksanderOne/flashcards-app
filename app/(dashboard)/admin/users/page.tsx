import { auth } from '@/lib/auth';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { redirect } from 'next/navigation';
import { UsersTable } from './users-table';
import { desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
    const session = await auth();
    if (!session?.user?.email) redirect('/login');

    if (session.user.role !== 'admin') {
        redirect('/learn');
    }

    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Panel Administratora</h2>
                    <p className="text-muted-foreground">Zarządzaj użytkownikami i uprawnieniami.</p>
                </div>
            </div>

            <UsersTable users={allUsers} />
        </div>
    );
}
