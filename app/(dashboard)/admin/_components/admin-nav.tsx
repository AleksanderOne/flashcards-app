"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Users, BookOpen, Settings, KeyRound } from "lucide-react";

const adminRoutes = [
  {
    label: "Użytkownicy",
    href: "/admin/users",
    icon: Users,
  },
  {
    label: "Słówka",
    href: "/admin/words",
    icon: BookOpen,
  },
  {
    label: "SSO",
    href: "/admin/sso-setup",
    icon: KeyRound,
  },
  {
    label: "Ustawienia",
    href: "/admin/settings",
    icon: Settings,
  },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="inline-flex items-center gap-1 p-1 bg-muted rounded-lg">
      {adminRoutes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            "flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all",
            pathname.startsWith(route.href)
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <route.icon className="mr-2 h-4 w-4" />
          {route.label}
        </Link>
      ))}
    </nav>
  );
}
