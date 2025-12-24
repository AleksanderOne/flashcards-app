'use client';

import { useState, useEffect } from 'react';
import { getAllWordsForAdmin, approveWord, rejectWord, updateWord, deleteWord } from '@/actions/words-actions';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Check, X, Pencil, Trash2, Loader2, Search, BookOpen, Clock, CheckCircle2, Filter, Languages } from 'lucide-react';
import { LEVELS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { levelColors, type LevelKey } from '@/lib/colors';

type Word = {
    id: string;
    english: string;
    polish: string;
    level: string;
    category: string;
    imageUrl: string | null;
    createdBy: string | null;
    isApproved: boolean | null;
    createdAt: Date | null;
    creatorName: string | null;
    creatorEmail: string | null;
};

export function WordsManagementCard() {
    const [words, setWords] = useState<Word[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [filters, setFilters] = useState({
        status: 'pending' as 'all' | 'approved' | 'pending',
        level: '',
        category: '',
        search: '',
    });
    const [editDialog, setEditDialog] = useState<{
        open: boolean;
        word: Word | null;
    }>({ open: false, word: null });

    const [editData, setEditData] = useState({
        english: '',
        polish: '',
        level: '',
        category: '',
        imageUrl: '',
    });

    // Pobranie listy słówek z uwzględnieniem filtrów
    const fetchWords = async () => {
        setLoading(true);
        const result = await getAllWordsForAdmin({
            status: filters.status,
            level: filters.level || undefined,
            category: filters.category || undefined,
            search: filters.search || undefined,
        });

        if (result.success && result.words) {
            setWords(result.words as any);
        } else {
            toast.error(result.error || 'Błąd podczas pobierania słówek');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchWords();
    }, [filters]);

    const handleApprove = async (wordId: string) => {
        setActionLoading(wordId);
        const result = await approveWord(wordId);

        if (result.success) {
            toast.success('Słówko zostało zatwierdzone');
            fetchWords();
        } else {
            toast.error(result.error || 'Błąd podczas zatwierdzania');
        }
        setActionLoading(null);
    };

    const handleReject = async (wordId: string) => {
        setActionLoading(wordId);
        const result = await rejectWord(wordId);

        if (result.success) {
            toast.success('Słówko zostało odrzucone');
            fetchWords();
        } else {
            toast.error(result.error || 'Błąd podczas odrzucania');
        }
        setActionLoading(null);
    };

    const handleEdit = (word: Word) => {
        setEditData({
            english: word.english,
            polish: word.polish,
            level: word.level,
            category: word.category,
            imageUrl: word.imageUrl || '',
        });
        setEditDialog({ open: true, word });
    };

    const handleSaveEdit = async () => {
        if (!editDialog.word) return;

        setActionLoading(editDialog.word.id);
        const result = await updateWord(editDialog.word.id, editData as any);

        if (result.success) {
            toast.success('Słówko zostało zaktualizowane');
            setEditDialog({ open: false, word: null });
            fetchWords();
        } else {
            toast.error(result.error || 'Błąd podczas aktualizacji');
        }
        setActionLoading(null);
    };

    const handleDelete = async (wordId: string) => {
        if (!confirm('Czy na pewno chcesz usunąć to słówko?')) return;

        setActionLoading(wordId);
        const result = await deleteWord(wordId);

        if (result.success) {
            toast.success('Słówko zostało usunięte');
            fetchWords();
        } else {
            toast.error(result.error || 'Błąd podczas usuwania');
        }
        setActionLoading(null);
    };

    const pendingCount = words.filter(w => !w.isApproved).length;
    const approvedCount = words.filter(w => w.isApproved).length;
    const totalCount = words.length;

    /**
     * Helper do pobierania klas badge dla poziomu CEFR
     */
    function getLevelBadgeClasses(level: string): string {
        const normalizedLevel = level.toUpperCase() as LevelKey;
        return levelColors[normalizedLevel]?.badge ?? levelColors.A1.badge;
    }

    return (
        <>
            <Card className="border-2 border-accent-violet-muted overflow-hidden !py-0">
                {/* Nagłówek z gradientem */}
                <CardHeader className="bg-gradient-to-r from-accent-violet-muted to-accent-fuchsia-muted border-b py-5">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent-fuchsia flex items-center justify-center text-white shadow-lg">
                                <Languages className="w-6 h-6" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Zarządzanie słówkami</CardTitle>
                                <CardDescription>
                                    Zatwierdzaj nowe słówka, edytuj i zarządzaj bazą danych
                                </CardDescription>
                            </div>
                        </div>
                        
                        {/* Statystyki */}
                        <div className="flex gap-3">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-warning-muted border border-warning/20">
                                <Clock className="w-4 h-4 text-warning" />
                                <div>
                                    <div className="text-xs text-warning-foreground/70">Oczekujące</div>
                                    <div className="text-lg font-bold text-warning-foreground">{pendingCount}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-success-muted border border-success/20">
                                <CheckCircle2 className="w-4 h-4 text-success" />
                                <div>
                                    <div className="text-xs text-success-foreground/70">Zatwierdzone</div>
                                    <div className="text-lg font-bold text-success-foreground">{approvedCount}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-info-muted border border-info/20">
                                <BookOpen className="w-4 h-4 text-info" />
                                <div>
                                    <div className="text-xs text-info-foreground/70">Razem</div>
                                    <div className="text-lg font-bold text-info-foreground">{totalCount}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-6">
                    {/* Sekcja filtrów - nowoczesny design */}
                    <div className="mb-6">
                        <div className="grid gap-4 md:grid-cols-4">
                            {/* Filtr statusu */}
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-warning/20 to-warning/5 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative p-4 rounded-xl bg-card border-2 border-warning/20 hover:border-warning/40 transition-colors">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                                            <Clock className="w-4 h-4 text-warning" />
                                        </div>
                                        <Label htmlFor="status-filter" className="text-sm font-semibold">Status</Label>
                                    </div>
                                    <Select
                                        value={filters.status}
                                        onValueChange={(value: any) =>
                                            setFilters({ ...filters, status: value })
                                        }
                                    >
                                        <SelectTrigger id="status-filter" className="h-10 bg-background/50">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pending">
                                                <span className="flex items-center gap-2">
                                                    <Clock className="w-3 h-3 text-warning" />
                                                    Oczekujące
                                                </span>
                                            </SelectItem>
                                            <SelectItem value="approved">
                                                <span className="flex items-center gap-2">
                                                    <CheckCircle2 className="w-3 h-3 text-success" />
                                                    Zatwierdzone
                                                </span>
                                            </SelectItem>
                                            <SelectItem value="all">
                                                <span className="flex items-center gap-2">
                                                    <Filter className="w-3 h-3 text-muted-foreground" />
                                                    Wszystkie
                                                </span>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Filtr poziomu */}
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-accent-violet/20 to-accent-fuchsia/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative p-4 rounded-xl bg-card border-2 border-accent-violet/20 hover:border-accent-violet/40 transition-colors">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-8 h-8 rounded-lg bg-accent-violet/10 flex items-center justify-center">
                                            <Languages className="w-4 h-4 text-accent-violet" />
                                        </div>
                                        <Label htmlFor="level-filter" className="text-sm font-semibold">Poziom CEFR</Label>
                                    </div>
                                    <Select
                                        value={filters.level || "_all"}
                                        onValueChange={(value) =>
                                            setFilters({ ...filters, level: value === "_all" ? "" : value })
                                        }
                                    >
                                        <SelectTrigger id="level-filter" className="h-10 bg-background/50">
                                            <SelectValue placeholder="Wszystkie" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="_all">Wszystkie poziomy</SelectItem>
                                            {LEVELS.map((level) => (
                                                <SelectItem key={level} value={level}>
                                                    <span className="font-bold">{level}</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Pole wyszukiwania */}
                            <div className="relative group md:col-span-2">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-accent-fuchsia/10 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative p-4 rounded-xl bg-card border-2 border-primary/20 hover:border-primary/40 transition-colors">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Search className="w-4 h-4 text-primary" />
                                        </div>
                                        <Label htmlFor="search" className="text-sm font-semibold">Szukaj słówka</Label>
                                    </div>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="search"
                                            placeholder="Wpisz angielskie lub polskie słowo..."
                                            value={filters.search}
                                            onChange={(e) =>
                                                setFilters({ ...filters, search: e.target.value })
                                            }
                                            className="pl-10 h-10 bg-background/50"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabela wyświetlająca słówka */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <span className="text-sm text-muted-foreground">Ładowanie słówek...</span>
                        </div>
                    ) : words.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                                <BookOpen className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <div className="text-center">
                                <h3 className="font-semibold text-lg">Brak słówek</h3>
                                <p className="text-muted-foreground text-sm">
                                    Nie znaleziono słówek spełniających kryteria
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-xl border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                                        <TableHead className="font-semibold">Angielski</TableHead>
                                        <TableHead className="font-semibold">Polski</TableHead>
                                        <TableHead className="font-semibold">Poziom</TableHead>
                                        <TableHead className="font-semibold">Kategoria</TableHead>
                                        <TableHead className="font-semibold">Autor</TableHead>
                                        <TableHead className="font-semibold">Status</TableHead>
                                        <TableHead className="text-right font-semibold">Akcje</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {words.map((word) => (
                                        <TableRow key={word.id} className="group">
                                            <TableCell className="font-semibold text-foreground">
                                                {word.english}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{word.polish}</TableCell>
                                            <TableCell>
                                                <Badge 
                                                    variant="outline" 
                                                    className={cn("font-bold", getLevelBadgeClasses(word.level))}
                                                >
                                                    {word.level}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-muted-foreground">{word.category}</span>
                                            </TableCell>
                                            <TableCell>
                                                {word.creatorName ? (
                                                    <div className="text-sm">
                                                        <div className="font-medium">{word.creatorName}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {word.creatorEmail}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <Badge variant="outline" className="bg-muted">
                                                        System
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {word.isApproved ? (
                                                    <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/20">
                                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                                        Zatwierdzone
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-warning/10 text-warning border-warning/20 hover:bg-warning/20">
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        Oczekuje
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                                    {!word.isApproved && (
                                                        <Button
                                                            size="icon-sm"
                                                            variant="ghost"
                                                            onClick={() => handleApprove(word.id)}
                                                            disabled={actionLoading === word.id}
                                                            className="hover:bg-success-muted hover:text-success"
                                                            title="Zatwierdź"
                                                        >
                                                            {actionLoading === word.id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Check className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="icon-sm"
                                                        variant="ghost"
                                                        onClick={() => handleEdit(word)}
                                                        className="hover:bg-info-muted hover:text-info"
                                                        title="Edytuj"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    {!word.isApproved && (
                                                        <Button
                                                            size="icon-sm"
                                                            variant="ghost"
                                                            onClick={() => handleReject(word.id)}
                                                            disabled={actionLoading === word.id}
                                                            className="hover:bg-error-muted hover:text-error"
                                                            title="Odrzuć"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="icon-sm"
                                                        variant="ghost"
                                                        onClick={() => handleDelete(word.id)}
                                                        disabled={actionLoading === word.id}
                                                        className="hover:bg-error-muted hover:text-error"
                                                        title="Usuń"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Okno edycji słówka */}
            <Dialog open={editDialog.open} onOpenChange={(open) => !open && setEditDialog({ open, word: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edytuj słówko</DialogTitle>
                        <DialogDescription>
                            Wprowadź zmiany w słówku
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-english">Angielski</Label>
                            <Input
                                id="edit-english"
                                value={editData.english}
                                onChange={(e) =>
                                    setEditData({ ...editData, english: e.target.value })
                                }
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-polish">Polski</Label>
                            <Input
                                id="edit-polish"
                                value={editData.polish}
                                onChange={(e) =>
                                    setEditData({ ...editData, polish: e.target.value })
                                }
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-level">Poziom</Label>
                            <Select
                                value={editData.level}
                                onValueChange={(value) =>
                                    setEditData({ ...editData, level: value })
                                }
                            >
                                <SelectTrigger id="edit-level">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {LEVELS.map((level) => (
                                        <SelectItem key={level} value={level}>
                                            {level}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-category">Kategoria</Label>
                            <Input
                                id="edit-category"
                                value={editData.category}
                                onChange={(e) =>
                                    setEditData({ ...editData, category: e.target.value })
                                }
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-imageUrl">URL obrazka</Label>
                            <Input
                                id="edit-imageUrl"
                                type="url"
                                value={editData.imageUrl}
                                onChange={(e) =>
                                    setEditData({ ...editData, imageUrl: e.target.value })
                                }
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setEditDialog({ open: false, word: null })}
                        >
                            Anuluj
                        </Button>
                        <Button
                            onClick={handleSaveEdit}
                            disabled={!!actionLoading}
                        >
                            {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Zapisz
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
