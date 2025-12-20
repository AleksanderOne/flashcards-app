'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
    GraduationCap,
    LayoutDashboard,
    Library,
    Trophy,
    BarChart3,
    LogOut,
    Menu,
    ShieldCheck,
    Printer,
    Settings,
    Timer,
    Loader2,
} from 'lucide-react';
import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { logout } from '@/app/actions/auth-actions';

/**
 * Komponent przycisku wylogowania z obsługą stanu ładowania.
 * Używa useFormStatus do śledzenia czy formularz jest w trakcie wysyłania.
 */
function LogoutButton() {
    const { pending } = useFormStatus();

    return (
        <Button
            type="submit"
            variant="ghost"
            disabled={pending}
            className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/10 disabled:opacity-50"
        >
            {pending ? (
                <Loader2 className="h-5 w-5 mr-3 animate-spin" />
            ) : (
                <LogOut className="h-5 w-5 mr-3" />
            )}
            {pending ? 'Wylogowywanie...' : 'Wyloguj się'}
        </Button>
    );
}

const guestRoutes = [
    {
        label: 'Nauka',
        icon: GraduationCap,
        href: '/learn',
        color: 'text-violet-500',
    },
    {
        label: 'Wyzwanie',
        icon: Timer,
        href: '/challenge',
        color: 'text-amber-500',
    },
    {
        label: 'Baza słówek',
        icon: Library,
        href: '/all-words',
        color: 'text-pink-700',
    },
    {
        label: 'Moje słówka',
        icon: LayoutDashboard,
        href: '/my-words',
        color: 'text-sky-500',
    },
    {
        label: 'Statystyki',
        icon: BarChart3,
        href: '/statistics',
        color: 'text-emerald-500',
    },
    {
        label: 'Drukuj słówka',
        icon: Printer,
        href: '/print-words',
        color: 'text-orange-500',
    },
    {
        label: 'Ustawienia',
        icon: Settings,
        href: '/settings',
        color: 'text-slate-500',
    },
    {
        label: 'Osiągnięcia',
        icon: Trophy,
        href: '/achievements',
        color: 'text-yellow-500',
    },
];

interface SidebarProps {
    isAdmin?: boolean;
}

export function Sidebar({ isAdmin }: SidebarProps) {
    const pathname = usePathname();

    const routes = isAdmin
        ? [
            ...guestRoutes,
            {
                label: 'Panel Admina',
                icon: ShieldCheck,
                href: '/admin/users',
                color: 'text-red-500',
            }
        ]
        : guestRoutes;

    return (
        <div className="space-y-4 py-4 flex flex-col h-full bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white border-r">
            <div className="px-3 py-2 flex-1">
                <Link href="/learn" className="flex items-center pl-3 mb-14">
                    <div className="w-8 h-8 mr-4 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                        <span className="text-xl">🎓</span>
                    </div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
                        Flashcards
                    </h1>
                </Link>
                <div className="space-y-1">
                    {routes.map((route) => (
                        <Link
                            key={route.href}
                            href={route.href}
                            className={cn(
                                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-slate-300 dark:hover:bg-white/10 rounded-lg transition",
                                pathname === route.href ? "bg-slate-200 dark:bg-white/10" : "text-zinc-500 dark:text-zinc-400"
                            )}
                        >
                            <div className="flex items-center flex-1">
                                <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                                {route.label}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
            <div className="px-3 py-2">
                <div className="flex items-center justify-between px-3 mb-4">
                    <span className="text-sm text-muted-foreground">Motyw</span>
                    <ThemeToggle />
                </div>
                <form action={logout}>
                    <LogoutButton />
                </form>
            </div>
        </div>
    );
}

export function MobileSidebar({ isAdmin }: SidebarProps) {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 bg-secondary pt-10 w-72">
                <Sidebar isAdmin={isAdmin} />
            </SheetContent>
        </Sheet>
    );
}
