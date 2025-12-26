'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Info, ExternalLink, Mail } from 'lucide-react';

interface EditEmailFormProps {
    currentEmail: string;
}

/**
 * Komponent wyświetlający email użytkownika (tylko do odczytu).
 * 
 * Zmiana emaila jest możliwa tylko w centrum logowania SSO.
 * Email jest synchronizowany automatycznie przy każdym logowaniu.
 */
export function EditEmailForm({ currentEmail }: EditEmailFormProps) {
    const ssoUrl = process.env.NEXT_PUBLIC_SSO_CENTER_URL || '#';

    return (
        <div className="space-y-4">
            {/* Wyświetlenie aktualnego emaila */}
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl border">
                <div className="w-10 h-10 rounded-lg bg-accent-fuchsia-muted flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-accent-fuchsia" />
                </div>
                <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">Aktualny email</div>
                    <div className="font-medium truncate">{currentEmail}</div>
                </div>
            </div>

            {/* Informacja o centrum logowania */}
            <Alert className="border-warning/30 bg-warning-muted">
                <Info className="h-4 w-4 text-warning" />
                <AlertDescription className="text-warning-foreground text-sm">
                    Zmiana adresu email jest możliwa tylko w centrum logowania.
                    Po zmianie, nowy email zostanie automatycznie zsynchronizowany.
                </AlertDescription>
            </Alert>

            {/* Link do centrum logowania */}
            {ssoUrl && ssoUrl !== '#' && (
                <Button variant="outline" className="w-full" asChild>
                    <a
                        href={ssoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Przejdź do centrum logowania
                    </a>
                </Button>
            )}
        </div>
    );
}
