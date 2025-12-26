'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { navIconColors } from '@/lib/colors';
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
    RefreshCw,
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
            className="w-full justify-between text-error hover:text-error hover:bg-error-muted disabled:opacity-50"
        >
            {pending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
                <LogOut className="h-5 w-5" />
            )}
            <span>{pending ? 'Wylogowywanie...' : 'Wyloguj się'}</span>
        </Button>
    );
}

const guestRoutes = [
    {
        label: 'Nauka',
        icon: GraduationCap,
        href: '/learn',
        color: navIconColors.learn,
    },
    {
        label: 'Powtórki',
        icon: RefreshCw,
        href: '/review',
        color: 'text-amber-500',
    },
    {
        label: 'Wyzwanie',
        icon: Timer,
        href: '/challenge',
        color: navIconColors.challenge,
    },
    {
        label: 'Baza słówek',
        icon: Library,
        href: '/all-words',
        color: navIconColors.allWords,
    },
    {
        label: 'Moje słówka',
        icon: LayoutDashboard,
        href: '/my-words',
        color: navIconColors.myWords,
    },
    {
        label: 'Statystyki',
        icon: BarChart3,
        href: '/statistics',
        color: navIconColors.statistics,
    },
    {
        label: 'Drukuj słówka',
        icon: Printer,
        href: '/print-words',
        color: navIconColors.print,
    },
    {
        label: 'Ustawienia',
        icon: Settings,
        href: '/settings',
        color: navIconColors.settings,
    },
    {
        label: 'Osiągnięcia',
        icon: Trophy,
        href: '/achievements',
        color: navIconColors.achievements,
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
                color: navIconColors.admin,
            }
        ]
        : guestRoutes;

    return (
        <div className="space-y-4 py-4 flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
            <div className="px-3 py-2 flex-1">
                <Link href="/learn" className="flex items-center pl-3 mb-14">
                    <div className="w-8 h-8 mr-4 rounded-lg bg-gradient-to-br from-primary to-accent-fuchsia flex items-center justify-center">
                        <span className="text-xl">🎓</span>
                    </div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent-fuchsia bg-clip-text text-transparent">
                        Flashcards
                    </h1>
                </Link>
                <div className="space-y-1">
                    {routes.map((route) => (
                        <Link
                            key={route.href}
                            href={route.href}
                            className={cn(
                                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-lg transition",
                                pathname === route.href ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-muted-foreground"
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
                    <span className="text-sm text-sidebar-muted-foreground">Motyw</span>
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
