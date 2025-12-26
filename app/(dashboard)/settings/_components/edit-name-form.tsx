'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateUserName } from '@/app/actions/profile-actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Loader2, Check } from 'lucide-react';

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
            if (result.success) {
                toast.success(result.message);
                router.refresh();
            } else {
                toast.error(result.error);
            }
        } catch (_error) {
            toast.error('Wystąpił nieoczekiwany błąd');
        } finally {
            setIsLoading(false);
        }
    };

    const hasChanges = name !== currentName;

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Nazwa wyświetlana</Label>
                <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Twoja nazwa"
                    disabled={isLoading}
                    className="h-11"
                />
            </div>
            <Button
                type="submit"
                disabled={isLoading || !hasChanges}
                className="bg-gradient-to-r from-primary to-accent-fuchsia hover:opacity-90 text-white"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Zapisywanie...
                    </>
                ) : (
                    <>
                        <Check className="w-4 h-4 mr-2" />
                        Zapisz zmiany
                    </>
                )}
            </Button>
        </form>
    );
}
