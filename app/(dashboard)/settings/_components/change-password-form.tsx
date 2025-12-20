'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel } from '@/components/ui/field';
import { updateUserPassword } from '@/app/actions/profile-actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface ChangePasswordFormProps {
    hasPassword: boolean;
}

export function ChangePasswordForm({ hasPassword }: ChangePasswordFormProps) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Walidacja
        if (newPassword !== confirmPassword) {
            toast.error('Nowe hasła nie są identyczne');
            return;
        }

        if (newPassword.length < 8) {
            toast.error('Hasło musi mieć minimum 8 znaków');
            return;
        }

        setIsLoading(true);

        try {
            const result = await updateUserPassword({
                currentPassword,
                newPassword
            });

            if (result.success) {
                toast.success(result.message);
                // Wyczyść formularz
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                router.refresh();
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error('Wystąpił nieoczekiwany błąd');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Zmiana hasła</CardTitle>
                <CardDescription>
                    {hasPassword
                        ? 'Zaktualizuj swoje hasło'
                        : 'Ustaw hasło dla swojego konta (obecnie logujesz się przez OAuth)'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {!hasPassword && (
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                Możesz ustawić hasło, aby móc się logować bezpośrednio emailem i hasłem,
                                oprócz logowania przez Google.
                            </AlertDescription>
                        </Alert>
                    )}

                    {hasPassword && (
                        <Field>
                            <FieldLabel>Aktualne hasło</FieldLabel>
                            <Input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="••••••••"
                                disabled={isLoading}
                                required
                            />
                        </Field>
                    )}

                    <Field>
                        <FieldLabel>Nowe hasło</FieldLabel>
                        <Input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                            disabled={isLoading}
                            required
                            minLength={8}
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                            Minimum 8 znaków
                        </p>
                    </Field>

                    <Field>
                        <FieldLabel>Potwierdź nowe hasło</FieldLabel>
                        <Input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            disabled={isLoading}
                            required
                        />
                    </Field>

                    <Button
                        type="submit"
                        disabled={isLoading || !newPassword || !confirmPassword || (hasPassword && !currentPassword)}
                    >
                        {isLoading ? 'Zapisywanie...' : 'Zmień hasło'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
