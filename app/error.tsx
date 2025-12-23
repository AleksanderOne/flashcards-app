'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, LogIn, Home } from 'lucide-react';

/**
 * Error Boundary dla aplikacji
 * 
 * Obsługuje błędy serwera (np. wygasła sesja SSO) i wyświetla
 * przyjazny dla użytkownika komunikat zamiast brzydkiego błędu 500.
 */
export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Logowanie błędu do konsoli (w produkcji można wysłać do serwisu monitoringu)
        console.error('Application error:', error);
    }, [error]);

    // Sprawdzamy czy błąd może być związany z sesją
    const isSessionError = error.message?.toLowerCase().includes('session') ||
        error.message?.toLowerCase().includes('unauthorized') ||
        error.message?.toLowerCase().includes('unauthenticated');

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
            <Card className="max-w-md w-full border-0 shadow-2xl">
                <CardHeader className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 mx-auto">
                        <AlertTriangle className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold">
                        Ups! Coś poszło nie tak
                    </CardTitle>
                    <CardDescription className="text-base">
                        {isSessionError
                            ? 'Twoja sesja mogła wygasnąć. Spróbuj zalogować się ponownie.'
                            : 'Wystąpił nieoczekiwany błąd. Spróbuj odświeżyć stronę.'}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Szczegóły błędu (tylko w trybie developerskim) */}
                    {process.env.NODE_ENV === 'development' && error.message && (
                        <div className="p-3 rounded-lg bg-muted/50 border border-muted text-sm">
                            <p className="font-medium text-muted-foreground mb-1">Szczegóły błędu:</p>
                            <code className="text-xs text-destructive break-all">
                                {error.message}
                            </code>
                            {error.digest && (
                                <p className="mt-2 text-xs text-muted-foreground">
                                    Digest: {error.digest}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Przyciski akcji */}
                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={reset}
                            className="w-full h-11 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Spróbuj ponownie
                        </Button>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => window.location.href = '/login'}
                            >
                                <LogIn className="mr-2 h-4 w-4" />
                                Zaloguj się
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => window.location.href = '/'}
                            >
                                <Home className="mr-2 h-4 w-4" />
                                Strona główna
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
