import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DeleteDataForm } from './_components/delete-data-form';
import { EditNameForm } from './_components/edit-name-form';
import { EditEmailForm } from './_components/edit-email-form';
import { ChangePasswordForm } from './_components/change-password-form';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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
            password: true,
            createdAt: true
        }
    });

    if (!user) {
        redirect('/login');
    }

    const hasPassword = !!user.password;

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

                    <div>
                        <h3 className="text-xl font-semibold mb-4">Bezpieczeństwo</h3>
                        <ChangePasswordForm hasPassword={hasPassword} />
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
