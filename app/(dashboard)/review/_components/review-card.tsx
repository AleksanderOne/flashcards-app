'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Keyboard, ImageIcon, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface ReviewWord {
    english: string;
    polish: string;
    level: string;
    category: string;
    interval: number;
}

interface ReviewCardProps {
    reviewsByCategory: Record<string, ReviewWord[]>;
    totalDueCount: number;
}

const LEARNING_MODES = [
    {
        id: 'pl_to_en_text',
        label: 'Pisanie (PL → EN)',
        icon: Keyboard,
        description: 'Przetłumacz na angielski'
    },
    {
        id: 'en_to_pl_text',
        label: 'Pisanie (EN → PL)',
        icon: Keyboard,
        description: 'Przetłumacz na polski'
    },
    {
        id: 'pl_to_en_quiz',
        label: 'Quiz (Obrazki)',
        icon: ImageIcon,
        description: 'Wybierz poprawną odpowiedź'
    },
];

export function ReviewCard({ reviewsByCategory, totalDueCount }: ReviewCardProps) {
    const router = useRouter();
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [mode, setMode] = useState<string>('pl_to_en_text');

    const categories = Object.keys(reviewsByCategory);

    const handleStartReview = () => {
        const params = new URLSearchParams({ mode });
        
        if (selectedCategory !== 'all') {
            // Wyodrębnienie poziomu i kategorii z klucza
            const [level, category] = selectedCategory.split(' - ');
            params.append('level', level);
            params.append('category', category);
        }

        router.push(`/review/session?${params.toString()}`);
    };

    // Obliczenie liczby słówek dla wybranej kategorii
    const selectedCount = selectedCategory === 'all' 
        ? totalDueCount 
        : reviewsByCategory[selectedCategory]?.length || 0;

    return (
        <Card className="shadow-lg border-2 border-amber-100 dark:border-amber-900/50">
            <CardHeader>
                <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
                    <RefreshCw className="w-6 h-6 text-amber-600" />
                    Sesja powtórek
                </CardTitle>
                <CardDescription className="text-center">
                    Skonfiguruj swoją sesję powtórek
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Wybór kategorii */}
                <div className="space-y-3">
                    <Label>Wybierz kategorię</Label>
                    <Select
                        value={selectedCategory}
                        onValueChange={setSelectedCategory}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Wszystkie kategorie" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">
                                <div className="flex items-center justify-between w-full gap-4">
                                    <span>Wszystkie kategorie</span>
                                    <Badge variant="secondary">{totalDueCount} słówek</Badge>
                                </div>
                            </SelectItem>
                            {categories.map((cat) => {
                                const count = reviewsByCategory[cat]?.length || 0;
                                return (
                                    <SelectItem key={cat} value={cat}>
                                        <div className="flex items-center justify-between w-full gap-4">
                                            <span>{cat}</span>
                                            <Badge variant="outline">{count}</Badge>
                                        </div>
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                </div>

                {/* Wybór trybu */}
                <div className="space-y-3">
                    <Label>Tryb powtórki</Label>
                    <div className="grid grid-cols-1 gap-3">
                        {LEARNING_MODES.map((m) => (
                            <div
                                key={m.id}
                                className={cn(
                                    "flex items-center p-3 border rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors",
                                    mode === m.id 
                                        ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20 ring-1 ring-amber-500" 
                                        : "border-slate-200 dark:border-slate-800"
                                )}
                                onClick={() => setMode(m.id)}
                            >
                                <div className={cn(
                                    "p-2 rounded-full mr-4",
                                    mode === m.id 
                                        ? "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300" 
                                        : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                                )}>
                                    <m.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-medium">{m.label}</div>
                                    <div className="text-xs text-muted-foreground">{m.description}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Podsumowanie i przycisk */}
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                        Słówka do powtórki w tej sesji:
                    </p>
                    <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                        {selectedCount}
                    </p>
                </div>

                <Button
                    className="w-full h-12 text-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25"
                    onClick={handleStartReview}
                    disabled={selectedCount === 0}
                >
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Rozpocznij powtórkę
                </Button>

            </CardContent>
        </Card>
    );
}

