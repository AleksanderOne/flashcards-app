'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel } from '@/components/ui/field';
import { updateUserName } from '@/app/actions/profile-actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface EditNameFormProps {
    currentName: string | null;
}

export function EditNameForm({ currentName }: EditNameFormProps) {
    const [name, setName] = useState(currentName || '');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await updateUserName(name);
            toast.success(result.message);
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Nie udało się zaktualizować nazwy');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Nazwa użytkownika</CardTitle>
                <CardDescription>Zmień swoją nazwę wyświetlaną w aplikacji</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Field>
                        <FieldLabel>Nazwa</FieldLabel>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Twoja nazwa"
                            disabled={isLoading}
                        />
                    </Field>
                    <Button type="submit" disabled={isLoading || name === currentName}>
                        {isLoading ? 'Zapisywanie...' : 'Zapisz nazwę'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
