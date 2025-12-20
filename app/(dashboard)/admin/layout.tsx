import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AdminNav } from './_components/admin-nav';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session || !session.user || session.user.role !== 'admin') {
        redirect('/');
    }

    return (
        <div className="flex flex-col h-full">
            <AdminNav />
            <div className="flex-1">
                {children}
            </div>
        </div>
    );
}
