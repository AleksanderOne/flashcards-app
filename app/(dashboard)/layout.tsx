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
            <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-50 bg-sidebar">
                <Sidebar isAdmin={isAdmin} />
            </div>
            <main className="md:pl-72 pb-10 min-h-screen bg-background">
                <div className="flex items-center p-4 md:hidden border-b bg-background">
                    <MobileSidebar isAdmin={isAdmin} />
                    <span className="font-bold ml-4">Flashcards</span>
                </div>

                {/* Globalne powitanie na każdej podstronie */}
                {session?.user?.name && (
                    <div className="container mx-auto px-8 pt-8 pb-0">
                        <div>
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent-fuchsia bg-clip-text text-transparent">
                                Witaj, {session.user.name.split(' ')[0]}! 👋
                            </h2>
                            <p className="text-muted-foreground mt-1">
                                Gotowy na dzisiejszą dawkę wiedzy?
                            </p>
                        </div>
                    </div>
                )}

                {children}
            </main>
        </div>
    );
}
