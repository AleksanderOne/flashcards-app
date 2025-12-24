"use client";

import { Loader2 } from "lucide-react";

interface PageLoaderProps {
    message?: string;
}

/**
 * Uniwersalny loader strony.
 * Wyświetlany automatycznie przez Next.js podczas ładowania danych.
 */
export function PageLoader({ message = "Ładowanie..." }: PageLoaderProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            {/* Kontener spinnera z efektem glow */}
            <div className="relative">
                {/* Zewnętrzny pulsujący ring */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 opacity-20 blur-xl animate-pulse scale-150" />

                {/* Spinner z gradientem */}
                <div className="relative p-4 rounded-full bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-950 dark:to-fuchsia-950">
                    <Loader2 className="h-10 w-10 text-violet-600 dark:text-violet-400 animate-spin" />
                </div>
            </div>

            {/* Tekst ładowania */}
            <p className="text-lg font-medium text-muted-foreground animate-pulse">
                {message}
            </p>
        </div>
    );
}
