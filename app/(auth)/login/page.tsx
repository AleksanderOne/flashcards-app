'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2, Shield, LogIn } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

/**
 * Wewnętrzny komponent logowania, który używa useSearchParams
 * Musi być owinięty w Suspense boundary (wymagane przez Next.js 16)
 */
function LoginContent() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const searchParams = useSearchParams();

    // Obsługa błędów z callbacku SSO
    useEffect(() => {
        const errorParam = searchParams.get('error');
        if (errorParam) {
            const errorMessages: Record<string, string> = {
                missing_code: 'Brak kodu autoryzacji. Spróbuj ponownie.',
                invalid_code: 'Kod autoryzacji jest nieprawidłowy lub wygasł.',
                blocked: 'Twoje konto zostało zablokowane.',
                server_error: 'Błąd serwera. Spróbuj ponownie później.',
            };
            setError(errorMessages[errorParam] || 'Wystąpił nieznany błąd.');
        }
    }, [searchParams]);

    const handleSSOLogin = () => {
        setIsLoading(true);
        setError('');

        // Przekierowanie do centrum logowania
        // Używamy window.location żeby uzyskać aktualny origin (localhost vs produkcja)
        const baseUrl = window.location.origin;
        const callbackUrl = encodeURIComponent(`${baseUrl}/api/auth/sso-callback`);

        // Pobieramy konfigurację z zmiennych środowiskowych (client-side)
        // Te wartości są publiczne i mogą być w NEXT_PUBLIC_*
        const centerUrl = process.env.NEXT_PUBLIC_SSO_CENTER_URL || 'https://centrum-logowania-app-y7gt.vercel.app';
        const clientId = process.env.NEXT_PUBLIC_SSO_CLIENT_ID || 'flashcards-uk61';

        const ssoUrl = `${centerUrl}/authorize?client_id=${clientId}&redirect_uri=${callbackUrl}`;

        window.location.href = ssoUrl;
    };

    return (
        <Card className="border-0 shadow-2xl">
            <CardHeader className="space-y-1 relative">
                <div className="absolute right-4 top-4">
                    <ThemeToggle />
                </div>
                <div className="text-center mb-2">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 mb-4">
                        <span className="text-4xl">🎓</span>
                    </div>
                </div>
                <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
                    Witaj ponownie!
                </CardTitle>
                <CardDescription className="text-center text-base">
                    Zaloguj się, aby kontynuować naukę
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                {error && (
                    <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Główny przycisk logowania SSO */}
                <Button
                    type="button"
                    className="w-full h-12 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-semibold shadow-lg shadow-violet-500/30 dark:shadow-violet-900/30"
                    onClick={handleSSOLogin}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Przekierowuję...
                        </>
                    ) : (
                        <>
                            <LogIn className="mr-2 h-5 w-5" />
                            Zaloguj przez Centrum
                        </>
                    )}
                </Button>

                {/* Informacja o bezpieczeństwie */}
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-muted">
                    <Shield className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-muted-foreground">
                        <p className="font-medium text-foreground mb-1">Bezpieczne logowanie</p>
                        <p>
                            Logowanie odbywa się przez Centrum Logowania z wykorzystaniem
                            uwierzytelniania Google. Twoje hasło nigdy nie jest przechowywane
                            w tej aplikacji.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * Fallback podczas ładowania (Suspense boundary)
 */
function LoginFallback() {
    return (
        <Card className="border-0 shadow-2xl">
            <CardHeader className="space-y-1">
                <div className="text-center mb-2">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 mb-4">
                        <span className="text-4xl">🎓</span>
                    </div>
                </div>
                <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
                    Witaj ponownie!
                </CardTitle>
                <CardDescription className="text-center text-base">
                    Ładowanie...
                </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
            </CardContent>
        </Card>
    );
}

/**
 * Strona logowania przez SSO (Centrum Logowania)
 * 
 * Flow:
 * 1. Użytkownik klika "Zaloguj przez Centrum"
 * 2. Redirect do centrum-logowania/authorize
 * 3. Centrum loguje przez Google
 * 4. Centrum przekierowuje z tokenem do /api/auth/sso-callback
 * 5. Callback weryfikuje token i tworzy lokalną sesję
 */
export default function LoginPage() {
    return (
        <Suspense fallback={<LoginFallback />}>
            <LoginContent />
        </Suspense>
    );
}
