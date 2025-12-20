
'use client';

import { useState, useRef } from 'react';
import { submitMultipleWordsForApproval } from '@/actions/words-actions';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Upload, FileText, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { parseWordsCSV, ParsedWord } from '@/lib/utils/csv-parser';
import { LevelType } from '@/lib/constants';

export function ImportWordsDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [previewWords, setPreviewWords] = useState<ParsedWord[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            // Wykorzystanie wydzielonej funkcji do parsowania pliku CSV
            const parsed = parseWordsCSV(content);
            setPreviewWords(parsed);
        };
        reader.readAsText(file);
    };

    const handleImport = async () => {
        const validWords = previewWords.filter(w => w.isValid);

        if (validWords.length === 0) {
            toast.error('Brak poprawnych słówek do importu');
            return;
        }

        setLoading(true);
        try {
            const result = await submitMultipleWordsForApproval(validWords.map(w => ({
                english: w.english,
                polish: w.polish,
                level: w.level as LevelType,
                category: w.category
            })));

            if (result.success) {
                toast.success(result.message || 'Słówka zostały zaimportowane');
                setOpen(false);
                setPreviewWords([]);
                if (fileInputRef.current) fileInputRef.current.value = '';
            } else {
                toast.error(result.error || 'Błąd importu');
            }
        } catch (error) {
            toast.error('Wystąpił nieoczekiwany błąd');
        } finally {
            setLoading(false);
        }
    };

    const validCount = previewWords.filter(w => w.isValid).length;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Import CSV
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Importuj słówka z CSV</DialogTitle>
                    <DialogDescription>
                        Format pliku: <code>angielski, polski, poziom, kategoria</code>
                        <br />
                        Przykładowo: <code>apple, jabłko, A1, Jedzenie</code>
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="flex flex-col gap-2">
                        <Button
                            variant="secondary"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full"
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            Wybierz plik CSV
                        </Button>
                        <input
                            type="file"
                            accept=".csv,.txt"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />
                    </div>

                    {previewWords.length > 0 && (
                        <div className="space-y-4">
                            <Alert>
                                <Check className="h-4 w-4" />
                                <AlertTitle>Znaleziono {previewWords.length} wierszy</AlertTitle>
                                <AlertDescription>
                                    Poprawnych słówek do importu: {validCount}
                                </AlertDescription>
                            </Alert>

                            <div className="rounded-md border max-h-[300px] overflow-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Angielski</TableHead>
                                            <TableHead>Polski</TableHead>
                                            <TableHead>Poziom</TableHead>
                                            <TableHead>Kategoria</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {previewWords.map((word, i) => (
                                            <TableRow key={i} className={!word.isValid ? "bg-red-50 dark:bg-red-950/20" : ""}>
                                                <TableCell>{word.english}</TableCell>
                                                <TableCell>{word.polish}</TableCell>
                                                <TableCell>{word.level}</TableCell>
                                                <TableCell>{word.category}</TableCell>
                                                <TableCell>
                                                    {word.isValid ? (
                                                        <Check className="h-4 w-4 text-green-500" />
                                                    ) : (
                                                        <span className="text-xs text-red-500 flex items-center gap-1">
                                                            <AlertCircle className="h-3 w-3" />
                                                            {word.error || 'Błąd'}
                                                        </span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="ghost"
                        onClick={() => setOpen(false)}
                    >
                        Anuluj
                    </Button>
                    <Button
                        onClick={handleImport}
                        disabled={loading || validCount === 0}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Importuj {validCount > 0 && `(${validCount})`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
