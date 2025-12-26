import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DeleteDataForm } from './_components/delete-data-form';
import { EditNameForm } from './_components/edit-name-form';
import { EditEmailForm } from './_components/edit-email-form';
import { db } from '@/lib/db/drizzle';
import { users, userStats } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
    Info, 
    User, 
    Mail, 
    Shield, 
    Calendar, 
    Crown,
    Flame,
    BookOpen,
    Target
} from 'lucide-react';
import { PageLayout } from '@/components/page-layout';

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

    // Pobierz statystyki użytkownika
    const stats = await db.query.userStats.findFirst({
        where: eq(userStats.userId, session.user.id),
    });

    if (!user) {
        redirect('/login');
    }

    const initials = user.name 
        ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : user.email[0].toUpperCase();

    return (
        <PageLayout
            title="Ustawienia"
            description="Zarządzaj swoim kontem i danymi."
        >
            <div className="space-y-6">
                {/* Główna sekcja - profil i edycja */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Karta profilu */}
                    <Card className="xl:row-span-2 border-2 border-violet-100 dark:border-violet-900/50 overflow-hidden">
                        <div className="h-24 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500" />
                        <CardContent className="pt-0 -mt-12 text-center">
                            {/* Avatar */}
                            <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white text-3xl font-bold shadow-xl border-4 border-background">
                                {initials}
                            </div>
                            
                            <div className="mt-4 space-y-1">
                                <h3 className="text-xl font-bold">{user.name || 'Użytkownik'}</h3>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                <Badge 
                                    variant={user.role === 'admin' ? 'default' : 'secondary'}
                                    className={user.role === 'admin' ? 'bg-gradient-to-r from-amber-500 to-orange-500' : ''}
                                >
                                    {user.role === 'admin' ? (
                                        <><Crown className="w-3 h-3 mr-1" /> Administrator</>
                                    ) : 'Użytkownik'}
                                </Badge>
                            </div>

                            {/* Statystyki profilu */}
                            <div className="grid grid-cols-3 gap-2 mt-6 pt-6 border-t">
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-1 text-accent-violet">
                                        <BookOpen className="w-4 h-4" />
                                        <span className="font-bold">{stats?.totalWordsLearned || 0}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">Słówek</div>
                                </div>
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-1 text-orange-500">
                                        <Flame className="w-4 h-4" />
                                        <span className="font-bold">{stats?.currentStreak || 0}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">Streak</div>
                                </div>
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-1 text-green-500">
                                        <Target className="w-4 h-4" />
                                        <span className="font-bold">{stats?.totalSessions || 0}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">Sesji</div>
                                </div>
                            </div>

                            {/* Data dołączenia */}
                            <div className="mt-6 pt-6 border-t">
                                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="w-4 h-4" />
                                    <span>Dołączył/a {new Date(user.createdAt).toLocaleDateString('pl-PL', { 
                                        day: 'numeric', 
                                        month: 'long', 
                                        year: 'numeric' 
                                    })}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Edycja nazwy */}
                    <Card className="border-2 hover:border-primary/30 dark:hover:border-primary/40 transition-colors">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-accent-violet-muted flex items-center justify-center">
                                    <User className="w-5 h-5 text-accent-violet" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Nazwa użytkownika</CardTitle>
                                    <CardDescription>Zmień swoją nazwę wyświetlaną</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <EditNameForm currentName={user.name} />
                        </CardContent>
                    </Card>

                    {/* Email */}
                    <Card className="border-2 hover:border-primary/30 dark:hover:border-primary/40 transition-colors">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-accent-fuchsia-muted flex items-center justify-center">
                                    <Mail className="w-5 h-5 text-accent-fuchsia" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Adres email</CardTitle>
                                    <CardDescription>Zarządzany przez centrum logowania</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <EditEmailForm currentEmail={user.email} />
                        </CardContent>
                    </Card>

                    {/* Bezpieczeństwo */}
                    <Card className="xl:col-span-2 border-2 hover:border-primary/30 dark:hover:border-primary/40 transition-colors">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-accent-sky-muted flex items-center justify-center">
                                    <Shield className="w-5 h-5 text-accent-sky" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Bezpieczeństwo</CardTitle>
                                    <CardDescription>Logowanie i autoryzacja</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Alert className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
                                <Info className="h-4 w-4 text-accent-sky" />
                                <AlertTitle className="text-blue-900 dark:text-blue-100">Logowanie przez Centrum SSO</AlertTitle>
                                <AlertDescription className="text-blue-700 dark:text-blue-300">
                                    Twoje konto jest powiązane z Centrum Logowania. Zmiana hasła i zarządzanie
                                    bezpieczeństwem odbywa się poprzez konto Google połączone z Centrum.
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                    </Card>
                </div>

                {/* Strefa niebezpieczna - pełna szerokość */}
                <DeleteDataForm />
            </div>
        </PageLayout>
    );
}
