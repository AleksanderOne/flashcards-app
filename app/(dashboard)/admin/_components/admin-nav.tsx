'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Users, BookOpen } from 'lucide-react';

const adminRoutes = [
    {
        label: 'Użytkownicy',
        href: '/admin/users',
        icon: Users,
    },
    {
        label: 'Słówka',
        href: '/admin/words',
        icon: BookOpen,
    },
];

export function AdminNav() {
    const pathname = usePathname();

    return (
        <div className="border-b bg-background">
            <div className="container mx-auto">
                <nav className="flex space-x-1 p-2">
                    {adminRoutes.map((route) => (
                        <Link
                            key={route.href}
                            href={route.href}
                            className={cn(
                                "flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors",
                                pathname.startsWith(route.href)
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <route.icon className="mr-2 h-4 w-4" />
                            {route.label}
                        </Link>
                    ))}
                </nav>
            </div>
        </div>
    );
}
