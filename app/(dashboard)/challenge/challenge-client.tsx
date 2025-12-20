'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Timer, Trophy, Play, RotateCcw, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ChallengeWord } from '@/actions/challenge-actions';
import { Progress } from "@/components/ui/progress";
import Link from 'next/link';

type Phase = 'setup' | 'playing' | 'finished';

interface ChallengeClientProps {
    availableWords: ChallengeWord[];
}

interface Question {
    word: ChallengeWord;
    options: string[]; // 4 Polish translations
    correctOptionIndex: number;
}

export default function ChallengeClient({ availableWords }: ChallengeClientProps) {
    const [phase, setPhase] = useState<Phase>('setup');
    const [durationMinutes, setDurationMinutes] = useState<number>(1);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [score, setScore] = useState<number>(0);
    const [totalAttempts, setTotalAttempts] = useState<number>(0);
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
    const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);

    // Filter available words to valid ones (just in case)
    const words = availableWords.filter(w => w.english && w.polish);

    const generateQuestion = useCallback(() => {
        if (words.length < 4) return null;

        // 1. Pick a random word for the question
        const correctWordIndex = Math.floor(Math.random() * words.length);
        const correctWord = words[correctWordIndex];

        // 2. Pick 3 distinct distractors
        const distractors: string[] = [];
        const usedIndices = new Set([correctWordIndex]);

        while (distractors.length < 3) {
            const idx = Math.floor(Math.random() * words.length);
            if (!usedIndices.has(idx)) {
                usedIndices.add(idx);
                distractors.push(words[idx].polish);
            }
        }

        // 3. Shuffle options
        const allOptions = [correctWord.polish, ...distractors];
        // Fisher-Yates shuffle
        for (let i = allOptions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
        }

        const correctIndex = allOptions.indexOf(correctWord.polish);

        return {
            word: correctWord,
            options: allOptions,
            correctOptionIndex: correctIndex
        };
    }, [words]);

    const startGame = () => {
        setScore(0);
        setTotalAttempts(0);
        setTimeLeft(durationMinutes * 60);
        setPhase('playing');

        const q = generateQuestion();
        setCurrentQuestion(q);
        setSelectedOptionIndex(null);
        setIsAnswerCorrect(null);
    };

    const handleAnswer = (index: number) => {
        if (selectedOptionIndex !== null || !currentQuestion) return; // Block double clicks

        setSelectedOptionIndex(index);
        const correct = index === currentQuestion.correctOptionIndex;
        setIsAnswerCorrect(correct);
        setTotalAttempts(prev => prev + 1);
        if (correct) {
            setScore(prev => prev + 1);
        }

        // Delay for next question
        setTimeout(() => {
            if (timeLeft > 0) {
                const nextQ = generateQuestion();
                setCurrentQuestion(nextQ);
                setSelectedOptionIndex(null);
                setIsAnswerCorrect(null);
            }
        }, 800); // 0.8s feedback
    };

    // Timer logic
    useEffect(() => {
        if (phase !== 'playing') return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setPhase('finished');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [phase]);

    // Format time
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (words.length < 4) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-in fade-in zoom-in duration-500">
                <Card className="max-w-md w-full border-none shadow-2xl bg-gradient-to-br from-white to-gray-50 dark:from-zinc-900 dark:to-zinc-950">
                    <CardContent className="flex flex-col items-center p-8 text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-2">
                            <AlertCircle className="w-8 h-8 text-orange-600 dark:text-orange-500" />
                        </div>
                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-red-600">
                            Zbyt mało słówek
                        </h2>
                        <p className="text-muted-foreground">
                            Aby rozpocząć Wyzwanie na Czas, musisz mieć przynajmniej 4 nauczone słówka (postęp &gt; 0).
                        </p>
                        <Button asChild className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/20">
                            <Link href="/learn">Idź do nauki</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
            <AnimatePresence mode="wait">
                {phase === 'setup' && (
                    <motion.div
                        key="setup"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="w-full max-w-md"
                    >
                        <Card className="border-none shadow-2xl bg-gradient-to-br from-white to-gray-50 dark:from-zinc-900 dark:to-zinc-950 overflow-hidden">
                            <div className="h-2 w-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500" />
                            <CardContent className="flex flex-col items-center p-8 space-y-8">
                                <div className="text-center space-y-2">
                                    <div className="flex justify-center mb-4">
                                        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 shadow-inner">
                                            <Timer className="w-12 h-12 text-purple-600 dark:text-purple-400" />
                                        </div>
                                    </div>
                                    <h1 className="text-3xl font-extrabold tracking-tight">
                                        Wyzwanie na Czas
                                    </h1>
                                    <p className="text-muted-foreground">
                                        Sprawdź jak dużo słówek pamiętasz. Wybierz poprawną odpowiedź najszybciej jak potrafisz!
                                    </p>
                                </div>

                                <div className="w-full space-y-4">
                                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider block text-center">
                                        Wybierz czas trwania
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[1, 2, 3, 4, 5, 6].map((mins) => (
                                            <Button
                                                key={mins}
                                                variant={durationMinutes === mins ? "default" : "outline"}
                                                onClick={() => setDurationMinutes(mins)}
                                                className={cn(
                                                    "h-12 text-lg font-medium transition-all duration-200",
                                                    durationMinutes === mins
                                                        ? "bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/25 ring-2 ring-purple-600 ring-offset-2 dark:ring-offset-zinc-950 scale-105"
                                                        : "hover:bg-purple-50 dark:hover:bg-purple-900/10 hover:border-purple-200"
                                                )}
                                            >
                                                {mins} min
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <Button
                                    onClick={startGame}
                                    size="lg"
                                    className="w-full h-14 text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-xl shadow-purple-500/20 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <Play className="w-6 h-6 mr-2 fill-current" />
                                    START
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {phase === 'playing' && currentQuestion && (
                    <motion.div
                        key="playing"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-2xl space-y-8"
                    >
                        {/* Top Bar */}
                        <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl rounded-2xl shadow-sm border border-white/20">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                    <Timer className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <span className={cn(
                                    "text-2xl font-mono font-bold tabular-nums",
                                    timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-foreground"
                                )}>
                                    {formatTime(timeLeft)}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest mr-2">Wynik</span>
                                <div className="px-4 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-bold text-lg">
                                    {score}
                                </div>
                            </div>
                        </div>

                        {/* Question Card */}
                        <Card className="border-none shadow-2xl bg-white dark:bg-zinc-900 overflow-hidden relative">
                            {/* Progress bar for feedback timing or just aesthetic */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-100 dark:bg-zinc-800">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                                    initial={{ width: "100%" }}
                                    animate={{ width: "0%" }}
                                    transition={{ duration: durationMinutes * 60, ease: "linear" }}
                                />
                            </div>

                            <CardContent className="p-8 sm:p-12 flex flex-col items-center">
                                <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-4">
                                    Przetłumacz na polski
                                </span>
                                <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-center bg-clip-text text-transparent bg-gradient-to-b from-zinc-800 to-zinc-500 dark:from-white dark:to-zinc-400 mb-8 max-w-full break-words leading-tight">
                                    {currentQuestion.word.english}
                                </h2>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                                    {currentQuestion.options.map((option, index) => {
                                        const isSelected = selectedOptionIndex === index;
                                        const isCorrect = index === currentQuestion.correctOptionIndex;

                                        // Determine button state
                                        let btnClass = "h-16 text-lg font-medium transition-all duration-200 border-2";

                                        if (selectedOptionIndex !== null) {
                                            // Show results
                                            if (isCorrect) {
                                                btnClass += " bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/25 scale-[1.02]";
                                            } else if (isSelected) {
                                                btnClass += " bg-red-500 border-red-500 text-white opacity-80";
                                            } else {
                                                btnClass += " opacity-40 grayscale";
                                            }
                                        } else {
                                            // Normal state
                                            btnClass += " hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/10 hover:-translate-y-0.5";
                                        }

                                        return (
                                            <Button
                                                key={index}
                                                variant="outline"
                                                className={btnClass}
                                                onClick={() => handleAnswer(index)}
                                                disabled={selectedOptionIndex !== null}
                                            >
                                                <div className="flex items-center justify-between w-full px-2">
                                                    <span className="truncate">{option}</span>
                                                    {selectedOptionIndex !== null && isCorrect && (
                                                        <CheckCircle2 className="w-5 h-5 ml-2 animate-in zoom-in" />
                                                    )}
                                                    {selectedOptionIndex !== null && isSelected && !isCorrect && (
                                                        <XCircle className="w-5 h-5 ml-2 animate-in zoom-in" />
                                                    )}
                                                </div>
                                            </Button>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {phase === 'finished' && (
                    <motion.div
                        key="finished"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-md"
                    >
                        <Card className="border-none shadow-2xl bg-gradient-to-br from-white to-gray-50 dark:from-zinc-900 dark:to-zinc-950 overflow-hidden text-center">
                            <div className="h-2 w-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500" />
                            <CardContent className="flex flex-col items-center p-8 space-y-8">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-green-500 blur-3xl opacity-20 rounded-full" />
                                    <Trophy className="w-24 h-24 text-yellow-500 relative z-10 drop-shadow-lg" />
                                </div>

                                <div className="space-y-2">
                                    <h2 className="text-3xl font-bold">Koniec Czasu!</h2>
                                    <p className="text-muted-foreground">Twój wynik w sesji {durationMinutes}-minutowej</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 w-full">
                                    <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-900/50 flex flex-col items-center justify-center">
                                        <span className="text-4xl font-bold text-green-600 dark:text-green-400">{score}</span>
                                        <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium mt-1">Poprawne</span>
                                    </div>
                                    <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-900/50 flex flex-col items-center justify-center">
                                        <span className="text-4xl font-bold text-zinc-700 dark:text-zinc-300">
                                            {totalAttempts > 0 ? Math.round((score / totalAttempts) * 100) : 0}%
                                        </span>
                                        <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium mt-1">Dokładność</span>
                                    </div>
                                </div>

                                <Button
                                    onClick={() => setPhase('setup')}
                                    size="lg"
                                    className="w-full h-12 text-lg font-medium bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200"
                                >
                                    <RotateCcw className="w-5 h-5 mr-2" />
                                    Zagraj Ponownie
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
