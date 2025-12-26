'use client';

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface DifficultWordsProps {
    words: {
        english: string;
        polish: string;
        total: number;
        correct: number;
        accuracy: number;
    }[];
    title: string;
    emptyMessage?: string;
    showAccuracy?: boolean;
}

export function DifficultWords({ words, title, emptyMessage = "Brak danych", showAccuracy = true }: DifficultWordsProps) {
    if (words.length === 0) {
        return (
            <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {words.map((word, index) => (
                <div
                    key={word.english}
                    className={cn(
                        "flex items-center gap-4 p-3 rounded-lg",
                        "bg-muted/30 hover:bg-muted/50 transition-colors"
                    )}
                >
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold truncate">{word.english}</span>
                            <span className="text-muted-foreground">→</span>
                            <span className="text-muted-foreground truncate">{word.polish}</span>
                        </div>
                        {showAccuracy && (
                            <div className="flex items-center gap-2 mt-1">
                                <Progress 
                                    value={word.accuracy} 
                                    className="h-1.5 flex-1" 
                                />
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {word.correct}/{word.total} ({word.accuracy.toFixed(0)}%)
                                </span>
                            </div>
                        )}
                    </div>
                    <Badge 
                        variant={word.accuracy < 50 ? "destructive" : word.accuracy < 75 ? "secondary" : "default"}
                        className="shrink-0"
                    >
                        {word.accuracy < 50 ? 'Trudne' : word.accuracy < 75 ? 'W trakcie' : 'Dobre'}
                    </Badge>
                </div>
            ))}
        </div>
    );
}

