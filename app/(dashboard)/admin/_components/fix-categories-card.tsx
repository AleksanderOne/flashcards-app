'use client';

import { useState } from 'react';
import { fixWordCategories } from '../_actions/fix-categories';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

type CategoryStat = {
    category: string;
    count: number;
};

type FixResult = {
    success: boolean;
    message: string;
    fixed: number;
    notFound: number;
    fixedWords?: Array<{ english: string; category: string; level: string }>;
    notFoundWords?: string[];
    statsBefore?: CategoryStat[];
    statsAfter?: CategoryStat[];
};

export function FixCategoriesCard() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<FixResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFix = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await fixWordCategories();
            setResult(res);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Wystąpił błąd podczas naprawy kategorii';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="max-w-md">
            <CardHeader>
                <CardTitle>Naprawa Kategorii Słówek</CardTitle>
                <CardDescription>
                    Przepisz słówka z kategorii &quot;General&quot; do właściwych kategorii na podstawie WORD_DATABASE
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Button
                    onClick={handleFix}
                    disabled={loading}
                    className="w-full"
                >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Napraw Kategorie
                </Button>

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {result && (
                    <div className="space-y-4">
                        <Alert variant={result.fixed > 0 ? "default" : "destructive"}>
                            <CheckCircle2 className="h-4 w-4" />
                            <AlertDescription>{result.message}</AlertDescription>
                        </Alert>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <h3 className="font-semibold mb-2">Statystyki przed:</h3>
                                <div className="text-sm space-y-1 max-h-60 overflow-y-auto">
                                    {result.statsBefore?.map(stat => (
                                        <div key={stat.category} className="flex justify-between">
                                            <span>{stat.category}</span>
                                            <span className="font-mono">{stat.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-2">Statystyki po:</h3>
                                <div className="text-sm space-y-1 max-h-60 overflow-y-auto">
                                    {result.statsAfter?.map(stat => (
                                        <div key={stat.category} className="flex justify-between">
                                            <span>{stat.category}</span>
                                            <span className="font-mono">{stat.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {result.fixedWords && result.fixedWords.length > 0 && (
                            <div>
                                <h3 className="font-semibold mb-2">
                                    Przykładowe naprawione słówka (pierwsze 50):
                                </h3>
                                <div className="text-sm space-y-1 max-h-40 overflow-y-auto">
                                    {result.fixedWords.map((word, idx) => (
                                        <div key={idx} className="text-xs">
                                            <span className="font-medium">{word.english}</span>
                                            {' → '}
                                            <span className="text-muted-foreground">
                                                {word.category} ({word.level})
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {result.notFoundWords && result.notFoundWords.length > 0 && (
                            <div>
                                <h3 className="font-semibold mb-2 text-destructive">
                                    Słówka nie znalezione w WORD_DATABASE:
                                </h3>
                                <div className="text-sm space-y-1 max-h-40 overflow-y-auto">
                                    {result.notFoundWords.map((word, idx) => (
                                        <div key={idx} className="text-xs text-muted-foreground">
                                            {word}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
