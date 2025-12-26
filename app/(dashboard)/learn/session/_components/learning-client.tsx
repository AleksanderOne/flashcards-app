'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getImageForWord } from '@/lib/pixabay';
import { submitAnswer } from '@/app/actions/learning';
import { Volume2, VolumeXIcon, CheckCircle, XCircle, ArrowRight, Loader2, Image as ImageIcon, X, LogOut } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { feedbackStyles } from '@/lib/colors';
import Image from 'next/image';

import { LevelType } from '@/lib/constants';

// Komponent wskaźnika trudności
function DifficultyBadge({ difficulty, errorCount, totalAttempts }: {
    difficulty: number;
    errorCount: number;
    totalAttempts: number;
}) {
    const getDifficultyInfo = (d: number) => {
        switch (d) {
            case 1: return { label: 'Łatwe', color: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300', icon: '✓' };
            case 2: return { label: 'Proste', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300', icon: '○' };
            case 3: return { label: 'Średnie', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300', icon: '◐' };
            case 4: return { label: 'Trudne', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300', icon: '●' };
            case 5: return { label: 'Bardzo trudne', color: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300', icon: '🔥' };
            default: return { label: 'Nieznane', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', icon: '?' };
        }
    };

    const info = getDifficultyInfo(difficulty);
    const accuracy = totalAttempts > 0 ? Math.round((1 - errorCount / totalAttempts) * 100) : 100;

    return (
        <div className="flex items-center gap-2">
            <span className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                info.color
            )}>
                <span>{info.icon}</span>
                <span>{info.label}</span>
            </span>
            {totalAttempts > 0 && (
                <span className="text-xs text-muted-foreground">
                    ({errorCount} błędów / {totalAttempts} prób • {accuracy}%)
                </span>
            )}
        </div>
    );
}

interface Word {
    id: string; // opcjonalne, głównie jako klucz
    english: string;
    polish: string;
    level: LevelType;
    category: string;
    imageUrl?: string | null;
    // Dane o trudności (opcjonalne, tylko dla powtórek)
    difficulty?: number; // 1-5 (1=łatwe, 5=trudne)
    errorCount?: number;
    totalAttempts?: number;
    easiness?: number;
}

interface LearningClientProps {
    initialWords: Word[];
    mode: 'pl_to_en_text' | 'en_to_pl_text' | 'pl_to_en_quiz' | 'en_to_pl_quiz';
    userName: string;
    sessionType?: 'learn' | 'review'; // Typ sesji: nauka nowych słówek lub powtórka
}

export function LearningClient({ initialWords, mode, userName, sessionType = 'learn' }: LearningClientProps) {
    const router = useRouter();
    const [words, _setWords] = useState<Word[]>(initialWords);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [input, setInput] = useState('');
    const [isChecking, setIsChecking] = useState(false);
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
    const [currentImage, setCurrentImage] = useState<string | null>(null);
    const [imageLoading, setImageLoading] = useState(false);
    const [sessionComplete, setSessionComplete] = useState(false);
    const [results, setResults] = useState<{ correct: number, incorrect: number }>({ correct: 0, incorrect: 0 });
    const [soundEnabled, setSoundEnabled] = useState(true); // Przełącznik dźwięku


    const startTimeRef = useRef<number>(Date.now());
    const inputRef = useRef<HTMLInputElement>(null);

    const currentWord = words[currentIndex];
    // Ustalenie kierunku tłumaczenia na podstawie trybu
    const isPlToEn = mode.startsWith('pl_to_en');
    const questionWord = isPlToEn ? currentWord?.polish : currentWord?.english;
    const answerWord = isPlToEn ? currentWord?.english : currentWord?.polish;

    // Pobieranie obrazka przy zmianie słówka
    useEffect(() => {
        if (currentWord) {
            setImageLoading(true);
            // Użycie URL z bazy lub pobranie z Pixabay
            if (currentWord.imageUrl) {
                setCurrentImage(currentWord.imageUrl);
                setImageLoading(false);
            } else {
                getImageForWord(currentWord.english).then(url => {
                    setCurrentImage(url);
                    setImageLoading(false);
                });
            }
        }
    }, [currentWord]);

    // Ustawienie fokusa na polu tekstowym przy zmianie słówka
    useEffect(() => {
        if (!feedback && inputRef.current) {
            // Opóźnienie dla pewności, że renderowanie zakończyło się
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        }
        startTimeRef.current = Date.now();
    }, [currentIndex, feedback]);

    const speak = (text: string) => {
        if (!soundEnabled) return; // Pominięcie odtwarzania przy wyłączonym dźwięku

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US'; // Wymowa zawsze w języku angielskim
        utterance.text = currentWord.english;

        window.speechSynthesis.speak(utterance);
    };

    const nextTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Czyszczenie licznika czasu przy odmontowaniu komponentu
    useEffect(() => {
        return () => {
            if (nextTimeoutRef.current) {
                clearTimeout(nextTimeoutRef.current);
            }
        };
    }, []);

    const handleCheck = useCallback(async () => {
        if (!input.trim()) return;

        setIsChecking(true);
        const timeSpent = Date.now() - startTimeRef.current;

        // Normalizacja tekstu (wielkość liter, białe znaki)
        const isCorrect = input.trim().toLowerCase() === answerWord.toLowerCase();

        setFeedback(isCorrect ? 'correct' : 'incorrect');

        if (isCorrect) {
            setResults(prev => ({ ...prev, correct: prev.correct + 1 }));
            // Opcjonalnie: Automatyczna wymowa przy poprawnej odpowiedzi
            if (isPlToEn) speak(currentWord.english);

            // Wymagane zatwierdzenie przez użytkownika (brak auto-przejścia)
        } else {
            setResults(prev => ({ ...prev, incorrect: prev.incorrect + 1 }));
        }

        // Zapis wyniku na serwerze
        await submitAnswer({
            wordEnglish: currentWord.english,
            wordPolish: currentWord.polish,
            isCorrect,
            mode: mode,
            level: currentWord.level,
            category: currentWord.category,
            timeSpentMs: timeSpent
        });

        setIsChecking(false);
    }, [input, answerWord, currentWord, isPlToEn, mode, speak]);

    // Walidacja w czasie rzeczywistym
    useEffect(() => {
        if (!currentWord || feedback !== null || isChecking) return;

        const normalizedInput = input.trim().toLowerCase();
        const normalizedAnswer = answerWord?.toLowerCase();

        if (normalizedAnswer && normalizedInput === normalizedAnswer) {
            handleCheck();
        }
    }, [input, answerWord, feedback, isChecking, currentWord, handleCheck]);

    const handleNext = useCallback(() => {
        // Zapobiega wielokrotnemu wywołaniu gdy sesja już zakończona
        if (sessionComplete) return;

        // Anulowanie automatycznego przejścia przy ręcznej interakcji
        if (nextTimeoutRef.current) {
            clearTimeout(nextTimeoutRef.current);
            nextTimeoutRef.current = null;
        }

        setInput('');
        setFeedback(null);
        setCurrentImage(null);

        if (currentIndex < words.length - 1) {
            setCurrentIndex(prev => prev + 1);
            // Przywrócenie fokusa (obsłużone przez useEffect)
        } else {
            setSessionComplete(true);
        }
    }, [currentIndex, words.length, sessionComplete]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !sessionComplete) {
            e.preventDefault();
            e.stopPropagation(); // Zapobiega duplikowaniu przez globalny listener
            if (feedback) {
                handleNext();
            } else if (input.trim()) {
                handleCheck();
            }
        }
    };

    // Globalna obsługa klawiszy Spacja i Enter podczas wyświetlania wyniku
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            // Nie reaguj gdy sesja jest zakończona
            if (sessionComplete) return;

            if (feedback !== null) {
                if (e.code === 'Space' || e.key === 'Enter') {
                    e.preventDefault();
                    handleNext();
                }
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [feedback, handleNext, sessionComplete]);

    if (sessionComplete) {
        const total = results.correct + results.incorrect;
        const accuracy = total > 0 ? Math.round((results.correct / total) * 100) : 0;

        return (
            <div className="w-full max-w-2xl mx-auto space-y-6 py-8">
                {/* Główna karta z gratulacjami */}
                <Card className="border-2 border-success/30 bg-gradient-to-br from-success-muted to-accent-emerald-muted shadow-xl">
                    <CardContent className="pt-8 pb-8 space-y-6">
                        {/* Ikona sukcesu */}
                        <div className="flex justify-center">
                            <div className="w-24 h-24 bg-gradient-to-br from-success to-accent-emerald rounded-full flex items-center justify-center text-6xl shadow-lg">
                                🎉
                            </div>
                        </div>

                        {/* Tytuł */}
                        <div className="text-center space-y-2">
                            <h2 className="text-3xl md:text-4xl font-bold text-success-foreground">
                                Sesja ukończona!
                            </h2>
                            <p className="text-lg text-success-foreground/80">
                                Ukończyłeś wszystkie {total} {total === 1 ? 'słówko' : total < 5 ? 'słówka' : 'słówek'} z tej sesji
                            </p>
                        </div>

                        {/* Statystyki */}
                        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                            {/* Poprawne */}
                            <div className="bg-card rounded-xl p-4 shadow-md border border-success">
                                <div className="text-3xl font-bold text-success">
                                    {results.correct}
                                </div>
                                <div className="text-sm text-success-foreground font-medium mt-1">
                                    Poprawne
                                </div>
                            </div>

                            {/* Dokładność */}
                            <div className="bg-card rounded-xl p-4 shadow-md border border-info">
                                <div className="text-3xl font-bold text-info">
                                    {accuracy}%
                                </div>
                                <div className="text-sm text-info-foreground font-medium mt-1">
                                    Dokładność
                                </div>
                            </div>

                            {/* Błędne */}
                            <div className="bg-card rounded-xl p-4 shadow-md border border-error">
                                <div className="text-3xl font-bold text-error">
                                    {results.incorrect}
                                </div>
                                <div className="text-sm text-error-foreground font-medium mt-1">
                                    Błędne
                                </div>
                            </div>
                        </div>

                        {/* Motywująca wiadomość */}
                        <div className="text-center max-w-md mx-auto">
                            <p className="text-base text-slate-700 dark:text-slate-300">
                                {accuracy >= 90 ? (
                                    <>🌟 Fantastyczna robota, {userName}! Twoje opanowanie materiału jest imponujące!</>
                                ) : accuracy >= 70 ? (
                                    <>👏 Dobra robota, {userName}! Kontynuuj ciężką pracę!</>
                                ) : accuracy >= 50 ? (
                                    <>💪 Niezły postęp, {userName}! Powtórka sprawi, że będzie jeszcze lepiej!</>
                                ) : (
                                    <>📚 Dobry początek, {userName}! Praktyka czyni mistrza!</>
                                )}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                                Twoje statystyki i postępy zostały zapisane.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Akcje */}
                <div className="flex flex-col gap-3">
                    <Button
                        onClick={() => router.push(sessionType === 'review' ? '/review' : '/learn')}
                        className="w-full h-14 text-lg shadow-lg"
                        size="lg"
                    >
                        {sessionType === 'review' ? '🔄 Wróć do powtórek' : '🏠 Wróć do wyboru poziomu'}
                    </Button>
                    <Button
                        onClick={() => router.push('/statistics')}
                        className="w-full h-14 text-lg"
                        variant="outline"
                        size="lg"
                    >
                        📊 Zobacz statystyki
                    </Button>
                </div>
            </div>
        );
    }

    if (!currentWord) return <div>Ładowanie...</div>;

    const progress = ((currentIndex) / words.length) * 100;

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">

            {/* Pasek postępu i kontrolki */}
            <div className="space-y-2">
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <div className="flex items-center gap-3">
                        <span>Słówko {currentIndex + 1} z {words.length}</span>
                        {/* Wskaźnik trudności (tylko dla powtórek) */}
                        {sessionType === 'review' && currentWord.difficulty !== undefined && (
                            <DifficultyBadge
                                difficulty={currentWord.difficulty}
                                errorCount={currentWord.errorCount || 0}
                                totalAttempts={currentWord.totalAttempts || 0}
                            />
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="mr-2">{Math.round(progress)}%</span>
                        <Button
                            size="sm"
                            variant={soundEnabled ? "default" : "outline"}
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className="gap-2"
                        >
                            {soundEnabled ? (
                                <>
                                    <Volume2 className="w-4 h-4" />
                                    <span className="hidden sm:inline">Dźwięk</span>
                                </>
                            ) : (
                                <>
                                    <VolumeXIcon className="w-4 h-4" />
                                    <span className="hidden sm:inline">Wyciszony</span>
                                </>
                            )}
                        </Button>

                        {/* Przycisk przerwania nauki */}
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-2 border-error/30 bg-error/5 text-error hover:bg-error/10 hover:border-error/50"
                                >
                                    <X className="w-4 h-4" />
                                    <span className="hidden sm:inline">Zakończ</span>
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center gap-2">
                                        <LogOut className="w-5 h-5 text-warning" />
                                        Przerwać naukę?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="space-y-2">
                                        <p>
                                            Ukończyłeś <span className="font-semibold text-foreground">{currentIndex}</span> z{' '}
                                            <span className="font-semibold text-foreground">{words.length}</span> słówek w tej sesji.
                                        </p>
                                        <p>
                                            Dotychczasowy postęp: <span className="text-success font-medium">{results.correct} poprawnych</span>,{' '}
                                            <span className="text-error font-medium">{results.incorrect} błędnych</span>
                                        </p>
                                        <p className="text-sm">
                                            Twój dotychczasowy postęp został zapisany. Czy na pewno chcesz zakończyć sesję?
                                        </p>
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Kontynuuj naukę</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => router.push(sessionType === 'review' ? '/review' : '/learn')}
                                        className="bg-error hover:bg-error/90 text-error-foreground"
                                    >
                                        Zakończ sesję
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
                <Progress value={progress} className="h-2" />
            </div>

            <Card className={cn(
                "border-2 transition-all duration-300",
                feedback === 'correct' ? feedbackStyles.correct.card :
                    feedback === 'incorrect' ? feedbackStyles.incorrect.card :
                        "border-border/50 shadow-xl hover:shadow-2xl"
            )}>
                <CardHeader className="text-center pb-2">
                    <div className="text-sm uppercase tracking-wider text-muted-foreground font-semibold">
                        {isPlToEn ? 'Przetłumacz na angielski' : 'Przetłumacz na polski'}
                    </div>
                </CardHeader>

                <CardContent className="space-y-6 pt-6">

                    {/* Obrazek (wsparcie wizualne) */}
                    <div className="relative w-full h-56 md:h-72 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/15 via-accent-fuchsia/10 to-accent-violet/15 dark:from-primary/25 dark:via-accent-fuchsia/15 dark:to-accent-violet/25 flex items-center justify-center shadow-lg">
                        {imageLoading ? (
                            <Loader2 className="w-10 h-10 animate-spin text-primary" />
                        ) : currentImage ? (
                            <>
                                <Image
                                    src={currentImage}
                                    alt={currentWord.english}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, 672px"
                                    priority
                                />
                                {/* Nakładka gradientowa poprawiająca czytelność */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                            </>
                        ) : (
                            <ImageIcon className="w-16 h-16 text-primary/40" />
                        )}
                    </div>

                    {/* Przycisk odtwarzania dźwięku */}
                    <div className="flex justify-center">
                        <Button
                            size="lg"
                            variant="secondary"
                            className="rounded-full shadow-md hover:shadow-lg transition-all gap-2"
                            onClick={() => speak(currentWord.english)}
                            disabled={!soundEnabled}
                        >
                            <Volume2 className="w-5 h-5" />
                            <span>Posłuchaj wymowy</span>
                        </Button>
                    </div>

                    {/* Słowo pytania */}
                    <div className="text-center">
                        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-2">
                            {questionWord}
                        </h2>
                        {/* Miejsce na opcjonalny kontekst lub zdanie przykładowe */}
                    </div>

                    {/* Obszar wprowadzania odpowiedzi */}
                    <div className="relative">
                        <Input
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={feedback !== null || isChecking}
                            placeholder={isPlToEn ? "Wpisz po angielsku..." : "Wpisz po polsku..."}
                            className={cn(
                                "h-14 text-xl text-center shadow-sm",
                                feedback === 'correct' && "border-success text-success bg-card",
                                feedback === 'incorrect' && "border-error text-error bg-card"
                            )}
                            autoComplete="off"
                            autoFocus
                        />

                        <AnimatePresence>
                            {feedback && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn(
                                        "mt-4 p-4 rounded-lg flex items-center justify-center gap-3",
                                        feedback === 'correct' ? feedbackStyles.correct.badge : feedbackStyles.incorrect.badge
                                    )}
                                >
                                    {feedback === 'correct' ? (
                                        <>
                                            <CheckCircle className="w-6 h-6" />
                                            <span className="font-bold text-lg">Świetnie!</span>
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="w-6 h-6" />
                                            <div className="flex flex-col items-start">
                                                <span className="font-bold">Niepoprawnie</span>
                                                <span className="text-sm">
                                                    Poprawna odpowiedź: <span className="font-bold underline">{answerWord}</span>
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                </CardContent>

                <CardFooter className="pt-2 pb-6 flex justify-center">
                    {!feedback ? (
                        <Button
                            size="lg"
                            className="w-full h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                            onClick={handleCheck}
                            disabled={!input.trim() || isChecking}
                        >
                            {isChecking ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sprawdź'}
                        </Button>
                    ) : (
                        <Button
                            size="lg"
                            className={cn(
                                "w-full h-12 text-lg font-semibold",
                                feedback === 'correct' ? "bg-success hover:bg-success/90 text-success-foreground" : "bg-error hover:bg-error/90 text-error-foreground"
                            )}
                            onClick={handleNext}
                        >
                            Dalej <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
