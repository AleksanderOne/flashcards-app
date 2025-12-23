import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DeleteDataForm } from './_components/delete-data-form';
import { EditNameForm } from './_components/edit-name-form';
import { EditEmailForm } from './_components/edit-email-form';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export default async function SettingsPage() {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        redirect('/login');
    }

    // Pobierz pełne dane użytkownika z bazy
    const user = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
        columns: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true
        }
    });

    if (!user) {
        redirect('/login');
    }

    return (
        <div className="p-8 space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Ustawienia</h2>
                <p className="text-muted-foreground">Zarządzaj swoim kontem i danymi.</p>
            </div>

            <div className="grid gap-6 max-w-4xl">
                {/* Podstawowe informacje */}
                <div className="space-y-6">
                    <div>
                        <h3 className="text-xl font-semibold mb-4">Profil</h3>
                        <div className="grid gap-6">
                            <EditNameForm currentName={user.name} />
                            <EditEmailForm currentEmail={user.email} />
                        </div>
                    </div>

                    {/* Informacja o SSO */}
                    <div>
                        <h3 className="text-xl font-semibold mb-4">Bezpieczeństwo</h3>
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertTitle>Logowanie przez Centrum</AlertTitle>
                            <AlertDescription>
                                Twoje konto jest powiązane z Centrum Logowania. Zmiana hasła i zarządzanie
                                bezpieczeństwem odbywa się poprzez konto Google połączone z Centrum.
                            </AlertDescription>
                        </Alert>
                    </div>
                </div>

                {/* Informacje o koncie (tylko do odczytu) */}
                <Card>
                    <CardHeader>
                        <CardTitle>Informacje o koncie</CardTitle>
                        <CardDescription>Podstawowe dane twojego konta</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Rola</label>
                                <p className="text-lg capitalize">{user.role || 'user'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Data utworzenia</label>
                                <p className="text-lg">{new Date(user.createdAt).toLocaleDateString('pl-PL')}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Usuwanie danych */}
                <div>
                    <h3 className="text-xl font-semibold mb-4">Zarządzanie danymi</h3>
                    <DeleteDataForm />
                </div>
            </div>
        </div>
    );
}
