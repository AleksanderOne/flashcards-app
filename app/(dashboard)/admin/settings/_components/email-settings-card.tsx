'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Save, Loader2, Bell, BellOff, Info } from 'lucide-react';
import { updateAppSettings, type AppSettings } from '../actions';
import { toast } from 'sonner';

interface EmailSettingsCardProps {
    settings: AppSettings;
}

export function EmailSettingsCard({ settings }: EmailSettingsCardProps) {
    const [isPending, setIsPending] = useState(false);
    const [contactEmail, setContactEmail] = useState(settings.contactEmail);
    const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(settings.emailNotificationsEnabled);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsPending(true);

        const formData = new FormData();
        formData.append('contactEmail', contactEmail);
        formData.append('emailNotificationsEnabled', emailNotificationsEnabled.toString());

        const result = await updateAppSettings(formData);
        
        if (result.success) {
            toast.success('Ustawienia zostały zapisane');
        } else {
            toast.error(result.error || 'Wystąpił błąd');
        }

        setIsPending(false);
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-violet-500" />
                    Ustawienia Email
                </CardTitle>
                <CardDescription>
                    Skonfiguruj adres email do otrzymywania wiadomości z formularza kontaktowego
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="contactEmail">Email kontaktowy</Label>
                        <Input
                            id="contactEmail"
                            type="email"
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            placeholder="kontakt@example.com"
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            Na ten adres będą wysyłane wiadomości z formularza kontaktowego
                        </p>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
                        <div className="flex items-center gap-3">
                            {emailNotificationsEnabled ? (
                                <Bell className="w-5 h-5 text-green-500" />
                            ) : (
                                <BellOff className="w-5 h-5 text-muted-foreground" />
                            )}
                            <div>
                                <p className="font-medium">Powiadomienia email</p>
                                <p className="text-sm text-muted-foreground">
                                    {emailNotificationsEnabled 
                                        ? 'Wysyłanie emaili włączone' 
                                        : 'Wysyłanie emaili wyłączone'}
                                </p>
                            </div>
                        </div>
                        <Button
                            type="button"
                            variant={emailNotificationsEnabled ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setEmailNotificationsEnabled(!emailNotificationsEnabled)}
                        >
                            {emailNotificationsEnabled ? 'Włączone' : 'Wyłączone'}
                        </Button>
                    </div>

                    <div className="flex items-start gap-2 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-700 dark:text-blue-300">
                            <p className="font-medium">Konfiguracja Resend</p>
                            <p className="mt-1">
                                Aby wysyłanie emaili działało, dodaj klucz API Resend w zmiennych środowiskowych:
                            </p>
                            <code className="block mt-2 p-2 bg-blue-100 dark:bg-blue-900/50 rounded text-xs">
                                RESEND_API_KEY=re_xxxxxxxxxxxx
                            </code>
                        </div>
                    </div>

                    <Button type="submit" disabled={isPending} className="w-full">
                        {isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Zapisywanie...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Zapisz ustawienia
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

