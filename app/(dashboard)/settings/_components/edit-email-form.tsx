'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, ExternalLink } from 'lucide-react';

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
        <Card>
            <CardHeader>
                <CardTitle>Adres email</CardTitle>
                <CardDescription>
                    Email jest zarządzany przez centrum logowania
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Wyświetlenie aktualnego emaila */}
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                    <span className="text-sm font-medium">{currentEmail}</span>
                </div>

                {/* Informacja o centrum logowania */}
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                        Zmiana adresu email jest możliwa tylko w centrum logowania.
                        Po zmianie w centrum, nowy email zostanie automatycznie
                        zsynchronizowany przy następnym logowaniu.
                    </AlertDescription>
                </Alert>

                {/* Link do centrum logowania */}
                {ssoUrl && ssoUrl !== '#' && (
                    <a
                        href={ssoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                        Przejdź do centrum logowania
                        <ExternalLink className="h-4 w-4" />
                    </a>
                )}
            </CardContent>
        </Card>
    );
}
