
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import { LEVEL_COLORS, getCategoryColor } from '@/lib/constants';

interface Word {
    id: string;
    english: string;
    polish: string;
    level: string;
    category: string;
    creatorName?: string | null;
    imageUrl?: string | null;
}

interface WordRowProps {
    word: Word;
    isAdmin: boolean;
    onEdit: (word: Word) => void;
    onDelete: (wordId: string) => void;
    isDeleting: boolean;
}

export function WordRow({ word, isAdmin, onEdit, onDelete, isDeleting }: WordRowProps) {
    const levelColor = LEVEL_COLORS[word.level] || {
        bg: 'bg-secondary',
        text: 'text-secondary-foreground',
        border: 'border-transparent'
    };

    const categoryColors = getCategoryColor(word.category);

    return (
        <TableRow>
            <TableCell className="font-medium">{word.english}</TableCell>
            <TableCell>{word.polish}</TableCell>
            <TableCell>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${levelColor.bg} ${levelColor.text} ${levelColor.border} border`}>
                    {word.level}
                </span>
            </TableCell>
            <TableCell>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${categoryColors.bg} ${categoryColors.text} ${categoryColors.border} border`}>
                    {word.category}
                </span>
            </TableCell>
            <TableCell>
                {word.creatorName ? (
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                        {word.creatorName}
                    </span>
                ) : (
                    <span className="text-muted-foreground text-xs">System</span>
                )}
            </TableCell>
            {isAdmin && (
                <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onEdit(word)}
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onDelete(word.id)}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="h-4 w-4 text-red-600" />
                            )}
                        </Button>
                    </div>
                </TableCell>
            )}
        </TableRow>
    );
}
