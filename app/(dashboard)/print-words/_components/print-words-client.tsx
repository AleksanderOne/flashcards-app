'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Printer, Download, Loader2 } from 'lucide-react';

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

export default function PrintWordsClient() {
    const [filterType, setFilterType] = useState<'all' | 'learning' | 'difficult' | 'custom' | 'period'>('all');
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
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1'];

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
        <div>
            {/* Panel filtrów - ukrywany przy druku */}
            <Card className="print:hidden mb-6">
                <CardHeader>
                    <CardTitle>Wybierz kryteria filtrowania</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <RadioGroup value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="all" id="all" />
                            <Label htmlFor="all">Wszystkie słówka (z filtrami)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="learning" id="learning" />
                            <Label htmlFor="learning">Słówka w trakcie nauki</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="difficult" id="difficult" />
                            <Label htmlFor="difficult">Słówka trudne do zapamiętania</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="period" id="period" />
                            <Label htmlFor="period">Słówka uczone w określonym okresie</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="custom" id="custom" />
                            <Label htmlFor="custom">Wybierz konkretne słówka</Label>
                        </div>
                    </RadioGroup>

                    {/* Filtry dla trybu "all" */}
                    {filterType === 'all' && (
                        <div className="space-y-4">
                            <div>
                                <Label className="mb-2 block">Kategorie:</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {categories.map((cat) => (
                                        <div key={cat} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`cat-${cat}`}
                                                checked={selectedCategories.includes(cat)}
                                                onCheckedChange={() => toggleCategory(cat)}
                                            />
                                            <Label htmlFor={`cat-${cat}`} className="cursor-pointer">
                                                {cat}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <Label className="mb-2 block">Poziomy:</Label>
                                <div className="flex gap-2">
                                    {levels.map((level) => (
                                        <div key={level} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`level-${level}`}
                                                checked={selectedLevels.includes(level)}
                                                onCheckedChange={() => toggleLevel(level)}
                                            />
                                            <Label htmlFor={`level-${level}`} className="cursor-pointer">
                                                {level}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Datepicker dla trybu "period" */}
                    {filterType === 'period' && (
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="dateFrom">Data od:</Label>
                                <Input
                                    id="dateFrom"
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="dateTo">Data do:</Label>
                                <Input
                                    id="dateTo"
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                        </div>
                    )}

                    {/* Wybór konkretnych słówek */}
                    {filterType === 'custom' && (
                        <div className="space-y-2">
                            <Label>Wybierz słówka:</Label>
                            {loadingWords ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                            ) : (
                                <div className="max-h-64 overflow-y-auto border rounded p-4 space-y-2">
                                    {allWords.map((word) => (
                                        <div key={word.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`word-${word.id}`}
                                                checked={selectedWordIds.includes(word.id)}
                                                onCheckedChange={() => toggleWord(word.id)}
                                            />
                                            <Label htmlFor={`word-${word.id}`} className="cursor-pointer">
                                                {word.english} - {word.polish} ({word.level}, {word.category})
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button onClick={handleGenerate} disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generowanie...
                                </>
                            ) : (
                                <>
                                    <Download className="mr-2 h-4 w-4" />
                                    Generuj listę
                                </>
                            )}
                        </Button>
                        {words.length > 0 && (
                            <Button onClick={handlePrint} variant="outline">
                                <Printer className="mr-2 h-4 w-4" />
                                Drukuj
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

                    <Card className="print:shadow-none print:border-0">
                        <CardHeader className="print:hidden">
                            <CardTitle>
                                Podgląd listy ({words.length} słówek)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="print-table">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b-2 border-gray-300">
                                            <th className="text-left py-2 px-3 w-12">Lp.</th>
                                            <th className="text-left py-2 px-3">Angielski</th>
                                            <th className="text-left py-2 px-3">Polski</th>
                                            <th className="text-left py-2 px-3 w-20">Poziom</th>
                                            <th className="text-left py-2 px-3">Kategoria</th>
                                            {(filterType === 'learning' || filterType === 'difficult') && (
                                                <th className="text-left py-2 px-3 w-24 print:hidden">Trudność</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {words.map((word, index) => (
                                            <tr key={word.id} className="border-b border-gray-200 hover:bg-gray-50">
                                                <td className="py-2 px-3">{index + 1}</td>
                                                <td className="py-2 px-3 font-medium">{word.english}</td>
                                                <td className="py-2 px-3">{word.polish}</td>
                                                <td className="py-2 px-3">
                                                    <span className="inline-block px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                                                        {word.level}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-3 text-sm">{word.category}</td>
                                                {(filterType === 'learning' || filterType === 'difficult') && word.progress && (
                                                    <td className="py-2 px-3 print:hidden">
                                                        <span className={`inline-block px-2 py-1 text-xs rounded ${word.progress.difficultyRating >= 4
                                                            ? 'bg-red-100 text-red-800'
                                                            : word.progress.difficultyRating >= 3
                                                                ? 'bg-orange-100 text-orange-800'
                                                                : 'bg-green-100 text-green-800'
                                                            }`}>
                                                            {word.progress.difficultyRating}/5
                                                        </span>
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
                <Card>
                    <CardContent className="py-12">
                        <p className="text-center text-muted-foreground">
                            Wybierz kryteria i kliknij &quot;Generuj listę&quot; aby zobaczyć słówka
                        </p>
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
