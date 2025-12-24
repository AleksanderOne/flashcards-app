import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { GraduationCap, Brain, Trophy, TrendingUp } from 'lucide-react';

export default async function HomePage() {
    const session = await auth();

    // Przekierowanie zalogowanego użytkownika do panelu nauki
    if (session) {
        redirect('/learn');
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-gray-950 dark:via-purple-950 dark:to-violet-950">
            {/* Navigation */}
            <nav className="border-b bg-background/50 backdrop-blur-sm">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                            <span className="text-2xl">🎓</span>
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
                            Flashcards
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <Link href="/login">
                            <Button variant="ghost">Zaloguj się</Button>
                        </Link>
                        <Link href="/login">
                            <Button className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white">
                                Rozpocznij naukę
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="container mx-auto px-4 py-20">
                <div className="max-w-4xl mx-auto text-center space-y-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-background/50 backdrop-blur-sm text-sm">
                        <span className="inline-flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        Poziomy CEFR: A1 - C1
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold leading-tight">
                        Ucz się angielskiego
                        <br />
                        <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
                            w sposób, który działa
                        </span>
                    </h1>

                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Zaawansowana platforma do nauki słówek z algorytmem spaced repetition,
                        statystykami i wieloma trybami nauki. Wszystko za darmo!
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/login">
                            <Button size="lg" className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white h-12 px-8 text-lg shadow-lg shadow-violet-500/30 dark:shadow-violet-900/30">
                                Zacznij naukę →
                            </Button>
                        </Link>
                        <Link href="/login">
                            <Button size="lg" variant="outline" className="h-12 px-8 text-lg">
                                Mam już konto
                            </Button>
                        </Link>
                    </div>

                    {/* Features */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 pt-16">
                        <div className="p-6 rounded-2xl border bg-card/50 backdrop-blur-sm hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-4">
                                <GraduationCap className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                            </div>
                            <h3 className="font-semibold text-lg mb-2">4 Tryby Nauki</h3>
                            <p className="text-sm text-muted-foreground">
                                Pisanie, rozsypanka, obrazki i wymowa
                            </p>
                        </div>

                        <div className="p-6 rounded-2xl border bg-card/50 backdrop-blur-sm hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 rounded-xl bg-fuchsia-100 dark:bg-fuchsia-900/30 flex items-center justify-center mb-4">
                                <Brain className="w-6 h-6 text-fuchsia-600 dark:text-fuchsia-400" />
                            </div>
                            <h3 className="font-semibold text-lg mb-2">Spaced Repetition</h3>
                            <p className="text-sm text-muted-foreground">
                                Algorytm SM-2 dla efektywnej nauki
                            </p>
                        </div>

                        <div className="p-6 rounded-2xl border bg-card/50 backdrop-blur-sm hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h3 className="font-semibold text-lg mb-2">Statystyki</h3>
                            <p className="text-sm text-muted-foreground">
                                Śledź swój postęp w czasie rzeczywistym
                            </p>
                        </div>

                        <div className="p-6 rounded-2xl border bg-card/50 backdrop-blur-sm hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 rounded-xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center mb-4">
                                <Trophy className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                            </div>
                            <h3 className="font-semibold text-lg mb-2">Osiągnięcia</h3>
                            <p className="text-sm text-muted-foreground">
                                Zdobywaj odznaki i utrzymuj streak
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t bg-background/50 backdrop-blur-sm mt-20">
                <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
                    <p>© 2025 Flashcards. Wszelkie prawa zastrzeżone.</p>
                </div>
            </footer>
        </div>
    );
}