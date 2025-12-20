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
import { Check, X, Pencil, Trash2, Loader2, Search } from 'lucide-react';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];

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

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Zarządzanie słówkami</CardTitle>
                            <CardDescription>
                                Zatwierdzaj nowe słówka, edytuj i zarządzaj bazą
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Badge variant="outline" className="h-fit">
                                Oczekujące: {pendingCount}
                            </Badge>
                            <Badge variant="outline" className="h-fit">
                                Zatwierdzone: {approvedCount}
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Sekcja filtrów */}
                    <div className="mb-6 grid gap-4 md:grid-cols-4">
                        <div className="space-y-2">
                            <Label htmlFor="status-filter">Status</Label>
                            <Select
                                value={filters.status}
                                onValueChange={(value: any) =>
                                    setFilters({ ...filters, status: value })
                                }
                            >
                                <SelectTrigger id="status-filter">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">Oczekujące</SelectItem>
                                    <SelectItem value="approved">Zatwierdzone</SelectItem>
                                    <SelectItem value="all">Wszystkie</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="level-filter">Poziom</Label>
                            <Select
                                value={filters.level || "_all"}
                                onValueChange={(value) =>
                                    setFilters({ ...filters, level: value === "_all" ? "" : value })
                                }
                            >
                                <SelectTrigger id="level-filter">
                                    <SelectValue placeholder="Wszystkie" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_all">Wszystkie</SelectItem>
                                    {LEVELS.map((level) => (
                                        <SelectItem key={level} value={level}>
                                            {level}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="search">Szukaj</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="search"
                                    placeholder="Szukaj słówka..."
                                    value={filters.search}
                                    onChange={(e) =>
                                        setFilters({ ...filters, search: e.target.value })
                                    }
                                    className="pl-9"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Tabela wyświetlająca słówka */}
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : words.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">
                            Nie znaleziono słówek
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Angielski</TableHead>
                                        <TableHead>Polski</TableHead>
                                        <TableHead>Poziom</TableHead>
                                        <TableHead>Kategoria</TableHead>
                                        <TableHead>Autor</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Akcje</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {words.map((word) => (
                                        <TableRow key={word.id}>
                                            <TableCell className="font-medium">
                                                {word.english}
                                            </TableCell>
                                            <TableCell>{word.polish}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{word.level}</Badge>
                                            </TableCell>
                                            <TableCell>{word.category}</TableCell>
                                            <TableCell>
                                                {word.creatorName ? (
                                                    <div className="text-sm">
                                                        <div>{word.creatorName}</div>
                                                        <div className="text-muted-foreground">
                                                            {word.creatorEmail}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <Badge variant="outline">System</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {word.isApproved ? (
                                                    <Badge variant="default">Zatwierdzone</Badge>
                                                ) : (
                                                    <Badge variant="destructive">Oczekuje</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    {!word.isApproved && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleApprove(word.id)}
                                                            disabled={actionLoading === word.id}
                                                        >
                                                            {actionLoading === word.id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Check className="h-4 w-4 text-green-600" />
                                                            )}
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleEdit(word)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    {!word.isApproved && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleReject(word.id)}
                                                            disabled={actionLoading === word.id}
                                                        >
                                                            <X className="h-4 w-4 text-red-600" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleDelete(word.id)}
                                                        disabled={actionLoading === word.id}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-600" />
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
