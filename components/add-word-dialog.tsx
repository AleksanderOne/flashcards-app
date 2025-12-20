'use client';

import { useState } from 'react';
import { submitWordForApproval } from '@/actions/words-actions';
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
import { Loader2, Plus, X } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];
const CATEGORIES = [
    'General',
    'Biznes',
    'Technologia',
    'Edukacja',
    'Podróże',
    'Jedzenie',
    'Sport',
    'Muzyka',
    'Film',
    'Nauka',
    'Zdrowie',
    'Rodzina',
    'Praca',
    'Dom',
    'Natura',
    'Społeczeństwo',
    'Polityka',
    'Ekonomia',
    'Sztuka',
    'Historia',
    'Geografia',
    'Religia',
    'Prawo',
    'Media',
    'Komunikacja',
    'Transport',
    'Zakupy',
    'Moda',
    'Zwierzęta',
    'Rośliny',
    'Pogoda',
    'Czas',
    'Liczby',
    'Kolory',
    'Kształty',
    'Kierunki',
    'Pozycje',
    'Ruch',
    'Dźwięki',
    'Zapachy',
    'Smaki',
    'Uczucia',
    'Cechy',
    'Stany',
    'Czynności',
    'Wydarzenia',
    'Miejsca',
    'Przedmioty',
    'Pojęcia',
    'Abstrakcja',
    'Konkret',
];

export function AddWordDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        english: '',
        polish: '',
        level: '' as any,
        category: '',
        imageUrl: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.english.trim() || !formData.polish.trim() || !formData.level || !formData.category) {
            toast.error('Wypełnij wszystkie wymagane pola');
            return;
        }

        setLoading(true);

        try {
            const result = await submitWordForApproval({
                english: formData.english.trim(),
                polish: formData.polish.trim(),
                level: formData.level,
                category: formData.category,
                imageUrl: formData.imageUrl.trim() || null,
            });

            if (result.success) {
                toast.success('Słówko zostało dodane i oczekuje na zatwierdzenie przez admina');
                setFormData({
                    english: '',
                    polish: '',
                    level: '' as any,
                    category: '',
                    imageUrl: '',
                });
                setOpen(false);
            } else {
                toast.error(result.error || 'Nie udało się dodać słówka');
            }
        } catch (error) {
            toast.error('Wystąpił nieoczekiwany błąd');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Dodaj słówko
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Dodaj nowe słówko</DialogTitle>
                        <DialogDescription>
                            Dodaj słówko do bazy. Po zatwierdzeniu przez admina będzie widoczne dla wszystkich użytkowników.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="english">
                                Angielski <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="english"
                                value={formData.english}
                                onChange={(e) =>
                                    setFormData({ ...formData, english: e.target.value })
                                }
                                placeholder="np. apple"
                                disabled={loading}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="polish">
                                Polski <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="polish"
                                value={formData.polish}
                                onChange={(e) =>
                                    setFormData({ ...formData, polish: e.target.value })
                                }
                                placeholder="np. jabłko"
                                disabled={loading}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="level">
                                Poziom <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={formData.level}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, level: value as any })
                                }
                                disabled={loading}
                                required
                            >
                                <SelectTrigger id="level">
                                    <SelectValue placeholder="Wybierz poziom" />
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
                            <Label htmlFor="category">
                                Kategoria <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, category: value })
                                }
                                disabled={loading}
                                required
                            >
                                <SelectTrigger id="category">
                                    <SelectValue placeholder="Wybierz kategorię" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    {CATEGORIES.map((category) => (
                                        <SelectItem key={category} value={category}>
                                            {category}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="imageUrl">URL obrazka (opcjonalnie)</Label>
                            <Input
                                id="imageUrl"
                                type="url"
                                value={formData.imageUrl}
                                onChange={(e) =>
                                    setFormData({ ...formData, imageUrl: e.target.value })
                                }
                                placeholder="https://example.com/image.jpg"
                                disabled={loading}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                        >
                            Anuluj
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Dodaj słówko
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
