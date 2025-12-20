import { ReactNode } from 'react';
import { Sidebar, MobileSidebar } from './_components/sidebar';
import { auth } from '@/lib/auth';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
    const session = await auth();
    let isAdmin = false;

    if (session?.user) {
        isAdmin = session.user.role === 'admin';
    }
    return (
        <div className="h-full relative">
            <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-50 bg-gray-900">
                <Sidebar isAdmin={isAdmin} />
            </div>
            <main className="md:pl-72 pb-10 min-h-screen bg-slate-50 dark:bg-black">
                <div className="flex items-center p-4 md:hidden border-b bg-background">
                    <MobileSidebar isAdmin={isAdmin} />
                    <span className="font-bold ml-4">Flashcards</span>
                </div>
                {children}
            </main>
        </div>
    );
}
