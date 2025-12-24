'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
    Printer, 
    Download, 
    Loader2, 
    FileText, 
    BookOpen, 
    AlertTriangle, 
    Calendar, 
    MousePointerClick,
    Filter,
    Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { levelColors, type LevelKey } from '@/lib/colors';

interface Word {
    id: string;
    english: string;
    polish: string;
    level: string;
    category: string;
    imageUrl?: string;
    progress?: {
        repetitions: number;
        difficultyRating: number;
        easinessFactor: number;
    };
}

type FilterType = 'all' | 'learning' | 'difficult' | 'custom' | 'period';

const FILTER_OPTIONS: { id: FilterType; label: string; description: string; icon: React.ReactNode }[] = [
    {
        id: 'all',
        label: 'Wszystkie słówka',
        description: 'Filtruj po kategoriach i poziomach',
        icon: <FileText className="w-5 h-5" />
    },
    {
        id: 'learning',
        label: 'W trakcie nauki',
        description: 'Słówka, które aktualnie powtarzasz',
        icon: <BookOpen className="w-5 h-5" />
    },
    {
        id: 'difficult',
        label: 'Trudne słówka',
        description: 'Słówka z niskim współczynnikiem',
        icon: <AlertTriangle className="w-5 h-5" />
    },
    {
        id: 'period',
        label: 'Okres czasowy',
        description: 'Słówka z wybranego zakresu dat',
        icon: <Calendar className="w-5 h-5" />
    },
    {
        id: 'custom',
        label: 'Własny wybór',
        description: 'Wybierz konkretne słówka ręcznie',
        icon: <MousePointerClick className="w-5 h-5" />
    }
];

/**
 * Helper do pobierania klas badge dla poziomu CEFR
 */
function getLevelBadgeClasses(level: string): string {
    const normalizedLevel = level.toUpperCase() as LevelKey;
    return levelColors[normalizedLevel]?.badge ?? levelColors.A1.badge;
}

export default function PrintWordsClient() {
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
    const [words, setWords] = useState<Word[]>([]);
    const [allWords, setAllWords] = useState<Word[]>([]);
    const [selectedWordIds, setSelectedWordIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingWords, setLoadingWords] = useState(false);

    const categories = ['Animals', 'Food', 'Travel', 'Technology', 'Business', 'Education', 'Health', 'Sports', 'General'];
    const levels: LevelKey[] = ['A1', 'A2', 'B1', 'B2', 'C1'];

    // Pobierz wszystkie słówka dla trybu custom
    useEffect(() => {
        if (filterType === 'custom') {
            setLoadingWords(true);
            fetch('/api/print-words?filterType=all')
                .then((res) => res.json())
                .then((data) => {
                    setAllWords(data);
                    setLoadingWords(false);
                })
                .catch((err) => {
                    console.error('Błąd podczas ładowania słówek:', err);
                    setLoadingWords(false);
                });
        }
    }, [filterType]);

    const handleGenerate = async () => {
        setLoading(true);

        try {
            const params = new URLSearchParams({ filterType });

            if (filterType === 'period' && dateFrom && dateTo) {
                params.append('dateFrom', dateFrom);
                params.append('dateTo', dateTo);
            }

            if (filterType === 'custom' && selectedWordIds.length > 0) {
                params.append('selectedIds', selectedWordIds.join(','));
            }

            if (filterType === 'all') {
                if (selectedCategories.length > 0) {
                    params.append('categories', selectedCategories.join(','));
                }
                if (selectedLevels.length > 0) {
                    params.append('levels', selectedLevels.join(','));
                }
            }

            const response = await fetch(`/api/print-words?${params.toString()}`);
            const data = await response.json();

            if (response.ok) {
                setWords(data);
            } else {
                console.error('Błąd:', data.error);
            }
        } catch (error) {
            console.error('Błąd podczas generowania listy słówek:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const toggleCategory = (category: string) => {
        setSelectedCategories((prev) =>
            prev.includes(category)
                ? prev.filter((c) => c !== category)
                : [...prev, category]
        );
    };

    const toggleLevel = (level: string) => {
        setSelectedLevels((prev) =>
            prev.includes(level)
                ? prev.filter((l) => l !== level)
                : [...prev, level]
        );
    };

    const toggleWord = (wordId: string) => {
        setSelectedWordIds((prev) =>
            prev.includes(wordId)
                ? prev.filter((id) => id !== wordId)
                : [...prev, wordId]
        );
    };

    return (
        <div className="space-y-6">
            {/* Panel filtrów - ukrywany przy druku */}
            <Card className="print:hidden border-2 border-accent-violet-muted shadow-lg overflow-hidden !py-0">
                <CardHeader className="flex flex-row items-center gap-3 bg-gradient-to-r from-primary/10 via-accent-fuchsia/10 to-accent-violet/10 dark:from-primary/20 dark:via-accent-fuchsia/15 dark:to-accent-violet/20 border-b py-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent-fuchsia flex items-center justify-center text-white shadow-lg shrink-0">
                        <Filter className="w-5 h-5" />
                    </div>
                    <div>
                        <CardTitle className="text-xl">Generator listy słówek</CardTitle>
                        <CardDescription>Wybierz kryteria i wygeneruj listę do druku</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    {/* Wybór typu filtra - karty */}
                    <div>
                        <Label className="text-sm font-medium text-muted-foreground mb-3 block">Tryb generowania</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                            {FILTER_OPTIONS.map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => setFilterType(option.id)}
                                    className={cn(
                                        "relative p-4 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-md",
                                        filterType === option.id
                                            ? "border-primary bg-accent-violet-muted ring-1 ring-primary shadow-md"
                                            : "border-border hover:border-primary/50 bg-card"
                                    )}
                                >
                                    <div className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors",
                                        filterType === option.id
                                            ? "bg-gradient-to-br from-primary to-accent-fuchsia text-white"
                                            : "bg-muted text-muted-foreground"
                                    )}>
                                        {option.icon}
                                    </div>
                                    <div className="font-medium text-sm">{option.label}</div>
                                    <div className="text-xs text-muted-foreground mt-1">{option.description}</div>
                                    {filterType === option.id && (
                                        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Filtry dla trybu "all" */}
                    {filterType === 'all' && (
                        <div className="space-y-5 p-5 bg-muted/30 rounded-xl border">
                            <div>
                                <Label className="text-sm font-medium mb-3 block flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-accent-violet" />
                                    Kategorie
                                </Label>
                                <div className="flex flex-wrap gap-2">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => toggleCategory(cat)}
                                            className={cn(
                                                "px-4 py-2 rounded-full text-sm font-medium border transition-all",
                                                selectedCategories.includes(cat)
                                                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                                                    : "bg-card border-border hover:border-primary/50 hover:bg-accent-violet-muted"
                                            )}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <Label className="text-sm font-medium mb-3 block flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-accent-fuchsia" />
                                    Poziomy CEFR
                                </Label>
                                <div className="flex flex-wrap gap-2">
                                    {levels.map((level) => (
                                        <button
                                            key={level}
                                            onClick={() => toggleLevel(level)}
                                            className={cn(
                                                "px-4 py-2 rounded-full text-sm font-bold border transition-all",
                                                selectedLevels.includes(level)
                                                    ? "bg-gradient-to-r from-primary to-accent-fuchsia text-white border-transparent shadow-md"
                                                    : cn("bg-card", getLevelBadgeClasses(level))
                                            )}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Datepicker dla trybu "period" */}
                    {filterType === 'period' && (
                        <div className="p-5 bg-muted/30 rounded-xl border">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="dateFrom" className="text-sm font-medium mb-2 block">Od daty</Label>
                                    <Input
                                        id="dateFrom"
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                        className="h-11"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="dateTo" className="text-sm font-medium mb-2 block">Do daty</Label>
                                    <Input
                                        id="dateTo"
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                        className="h-11"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Wybór konkretnych słówek */}
                    {filterType === 'custom' && (
                        <div className="p-5 bg-muted/30 rounded-xl border">
                            <Label className="text-sm font-medium mb-3 block">
                                Wybierz słówka ({selectedWordIds.length} zaznaczonych)
                            </Label>
                            {loadingWords ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : (
                                <div className="max-h-72 overflow-y-auto rounded-lg border bg-card p-1 space-y-1">
                                    {allWords.map((word) => (
                                        <div
                                            key={word.id}
                                            onClick={() => toggleWord(word.id)}
                                            className={cn(
                                                "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                                                selectedWordIds.includes(word.id)
                                                    ? "bg-accent-violet-muted"
                                                    : "hover:bg-muted"
                                            )}
                                        >
                                            <Checkbox
                                                checked={selectedWordIds.includes(word.id)}
                                                onCheckedChange={() => toggleWord(word.id)}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium truncate">{word.english}</div>
                                                <div className="text-sm text-muted-foreground truncate">{word.polish}</div>
                                            </div>
                                            <Badge variant="outline" className={cn("shrink-0", getLevelBadgeClasses(word.level))}>
                                                {word.level}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Przyciski akcji */}
                    <div className="flex flex-wrap gap-3 pt-2">
                        <Button 
                            onClick={handleGenerate} 
                            disabled={loading}
                            size="lg"
                            className="bg-gradient-to-r from-primary to-accent-fuchsia hover:opacity-90 text-primary-foreground shadow-lg shadow-primary/25"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Generowanie...
                                </>
                            ) : (
                                <>
                                    <Download className="mr-2 h-5 w-5" />
                                    Generuj listę
                                </>
                            )}
                        </Button>
                        {words.length > 0 && (
                            <Button onClick={handlePrint} variant="outline" size="lg">
                                <Printer className="mr-2 h-5 w-5" />
                                Drukuj ({words.length})
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Podgląd i widok do druku */}
            {words.length > 0 && (
                <div className="print-content">
                    <div className="print:block hidden mb-8">
                        <h1 className="text-3xl font-bold text-center mb-2">Flashcards - Lista Słówek</h1>
                        <p className="text-center text-sm text-gray-600">
                            Wygenerowano: {new Date().toLocaleDateString('pl-PL')}
                        </p>
                        <p className="text-center text-sm text-gray-600 mb-4">
                            Liczba słówek: {words.length}
                        </p>
                    </div>

                    <Card className="print:shadow-none print:border-0 border-2 !py-0">
                        <CardHeader className="flex flex-row items-center gap-3 print:hidden bg-gradient-to-r from-success-muted to-accent-emerald-muted border-b py-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-success to-accent-emerald flex items-center justify-center text-white shadow-lg shrink-0">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Podgląd listy</CardTitle>
                                <CardDescription>{words.length} słówek gotowych do druku</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="print-table overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b-2 bg-muted/50">
                                            <th className="text-left py-3 px-4 font-semibold w-12">#</th>
                                            <th className="text-left py-3 px-4 font-semibold">Angielski</th>
                                            <th className="text-left py-3 px-4 font-semibold">Polski</th>
                                            <th className="text-left py-3 px-4 font-semibold w-24">Poziom</th>
                                            <th className="text-left py-3 px-4 font-semibold">Kategoria</th>
                                            {(filterType === 'learning' || filterType === 'difficult') && (
                                                <th className="text-left py-3 px-4 font-semibold w-24 print:hidden">Trudność</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {words.map((word, index) => (
                                            <tr key={word.id} className="border-b hover:bg-muted/30 transition-colors">
                                                <td className="py-3 px-4 text-muted-foreground">{index + 1}</td>
                                                <td className="py-3 px-4 font-semibold">{word.english}</td>
                                                <td className="py-3 px-4">{word.polish}</td>
                                                <td className="py-3 px-4">
                                                    <Badge variant="outline" className={getLevelBadgeClasses(word.level)}>
                                                        {word.level}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4 text-sm text-muted-foreground">{word.category}</td>
                                                {(filterType === 'learning' || filterType === 'difficult') && word.progress && (
                                                    <td className="py-3 px-4 print:hidden">
                                                        <Badge variant={
                                                            word.progress.difficultyRating >= 4 ? "destructive" :
                                                            word.progress.difficultyRating >= 3 ? "secondary" : "default"
                                                        }>
                                                            {word.progress.difficultyRating}/5
                                                        </Badge>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {words.length === 0 && !loading && (
                <Card className="border-dashed border-2">
                    <CardContent className="py-16">
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 mx-auto rounded-2xl bg-muted flex items-center justify-center">
                                <FileText className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Brak wygenerowanych słówek</h3>
                                <p className="text-muted-foreground">
                                    Wybierz kryteria filtrowania i kliknij &quot;Generuj listę&quot;
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Style do drukowania */}
            <style jsx global>{`
                @media print {
                    body {
                        print-color-adjust: exact;
                        -webkit-print-color-adjust: exact;
                    }
                    
                    @page {
                        margin: 1.5cm;
                        size: A4;
                    }
                    
                    .print-content {
                        page-break-after: auto;
                    }
                    
                    .print-table table {
                        page-break-inside: auto;
                    }
                    
                    .print-table tr {
                        page-break-inside: avoid;
                        page-break-after: auto;
                    }
                    
                    .print-table thead {
                        display: table-header-group;
                    }
                    
                    /* Ukryj elementy nawigacji i UI */
                    nav, header, footer, .sidebar {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
