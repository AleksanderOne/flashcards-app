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
import { Volume2, VolumeXIcon, CheckCircle, XCircle, ArrowRight, Loader2, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface Word {
    id: string; // opcjonalne, głównie jako klucz
    english: string;
    polish: string;
    level: string;
    category: string;
    imageUrl?: string | null;
}

interface LearningClientProps {
    initialWords: Word[];
    mode: 'pl_to_en_text' | 'en_to_pl_text' | 'pl_to_en_quiz' | 'en_to_pl_quiz';
    userName: string;
}

export function LearningClient({ initialWords, mode, userName }: LearningClientProps) {
    const router = useRouter();
    const [words, setWords] = useState<Word[]>(initialWords);
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

    const handleNext = () => {
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
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (feedback) {
                handleNext();
            } else {
                handleCheck();
            }
        }
    };

    // Globalna obsługa klawiszy Spacja i Enter podczas wyświetlania wyniku
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (feedback !== null) {
                if (e.code === 'Space' || e.key === 'Enter') {
                    e.preventDefault();
                    handleNext();
                }
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [feedback, handleNext]);

    if (sessionComplete) {
        const total = results.correct + results.incorrect;
        const accuracy = total > 0 ? Math.round((results.correct / total) * 100) : 0;

        return (
            <div className="w-full max-w-2xl mx-auto space-y-6 py-8">
                {/* Główna karta z gratulacjami */}
                <Card className="border-2 border-green-500/30 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 shadow-xl">
                    <CardContent className="pt-8 pb-8 space-y-6">
                        {/* Ikona sukcesu */}
                        <div className="flex justify-center">
                            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-6xl shadow-lg">
                                🎉
                            </div>
                        </div>

                        {/* Tytuł */}
                        <div className="text-center space-y-2">
                            <h2 className="text-3xl md:text-4xl font-bold text-green-900 dark:text-green-100">
                                Sesja ukończona!
                            </h2>
                            <p className="text-lg text-green-700 dark:text-green-300">
                                Ukończyłeś wszystkie {total} {total === 1 ? 'słówko' : total < 5 ? 'słówka' : 'słówek'} z tej sesji
                            </p>
                        </div>

                        {/* Statystyki */}
                        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                            {/* Poprawne */}
                            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-md border border-green-200 dark:border-green-800">
                                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                                    {results.correct}
                                </div>
                                <div className="text-sm text-green-700 dark:text-green-300 font-medium mt-1">
                                    Poprawne
                                </div>
                            </div>

                            {/* Dokładność */}
                            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-md border border-blue-200 dark:border-blue-800">
                                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                    {accuracy}%
                                </div>
                                <div className="text-sm text-blue-700 dark:text-blue-300 font-medium mt-1">
                                    Dokładność
                                </div>
                            </div>

                            {/* Błędne */}
                            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-md border border-red-200 dark:border-red-800">
                                <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                                    {results.incorrect}
                                </div>
                                <div className="text-sm text-red-700 dark:text-red-300 font-medium mt-1">
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
                        onClick={() => router.push('/learn')}
                        className="w-full h-14 text-lg shadow-lg"
                        size="lg"
                    >
                        🏠 Wróć do wyboru poziomu
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

            {/* Pasek postępu i przełącznik dźwięku */}
            <div className="space-y-2">
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>Słówko {currentIndex + 1} z {words.length}</span>
                    <div className="flex items-center gap-4">
                        <span>{Math.round(progress)}%</span>
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
                    </div>
                </div>
                <Progress value={progress} className="h-2" />
            </div>

            <Card className={cn(
                "border-2 transition-all duration-300",
                feedback === 'correct' ? "border-green-500 bg-green-50/50 dark:bg-green-950/30 shadow-green-500/20 shadow-lg" :
                    feedback === 'incorrect' ? "border-red-500 bg-red-50/50 dark:bg-red-950/30 shadow-red-500/20 shadow-lg" :
                        "border-border/50 shadow-xl hover:shadow-2xl"
            )}>
                <CardHeader className="text-center pb-2">
                    <div className="text-sm uppercase tracking-wider text-muted-foreground font-semibold">
                        {isPlToEn ? 'Przetłumacz na angielski' : 'Przetłumacz na polski'}
                    </div>
                </CardHeader>

                <CardContent className="space-y-6 pt-6">

                    {/* Obrazek (wsparcie wizualne) */}
                    <div className="relative w-full h-56 md:h-72 rounded-2xl overflow-hidden bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-950/30 dark:to-fuchsia-950/30 flex items-center justify-center shadow-lg">
                        {imageLoading ? (
                            <Loader2 className="w-10 h-10 animate-spin text-violet-500" />
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
                            <ImageIcon className="w-16 h-16 text-violet-300 dark:text-violet-700" />
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
                                feedback === 'correct' && "border-green-500 text-green-600 bg-white dark:bg-black",
                                feedback === 'incorrect' && "border-red-500 text-red-600 bg-white dark:bg-black"
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
                                        feedback === 'correct' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
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
                                feedback === 'correct' ? "bg-green-600 hover:bg-green-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"
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
