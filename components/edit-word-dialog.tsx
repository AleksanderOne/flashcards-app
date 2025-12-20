'use client';

import { useState, useEffect } from 'react';
import { updateWord } from '@/actions/words-actions';
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];

interface WordData {
    id: string;
    english: string;
    polish: string;
    level: string;
    category: string;
    imageUrl: string | null;
}

interface EditWordDialogProps {
    word: WordData | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function EditWordDialog({ word, open, onOpenChange, onSuccess }: EditWordDialogProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        english: '',
        polish: '',
        level: '',
        category: '',
        imageUrl: '',
    });

    useEffect(() => {
        if (word) {
            setFormData({
                english: word.english,
                polish: word.polish,
                level: word.level,
                category: word.category,
                imageUrl: word.imageUrl || '',
            });
        }
    }, [word]);

    const handleSave = async () => {
        if (!word) return;

        setLoading(true);
        try {
            const result = await updateWord(word.id, formData as any);
            if (result.success) {
                toast.success('Słówko zostało zaktualizowane');
                onOpenChange(false);
                if (onSuccess) onSuccess();
            } else {
                toast.error(result.error || 'Błąd podczas aktualizacji');
            }
        } catch (error) {
            toast.error('Wystąpił błąd podczas zapisu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
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
                            value={formData.english}
                            onChange={(e) =>
                                setFormData({ ...formData, english: e.target.value })
                            }
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="edit-polish">Polski</Label>
                        <Input
                            id="edit-polish"
                            value={formData.polish}
                            onChange={(e) =>
                                setFormData({ ...formData, polish: e.target.value })
                            }
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="edit-level">Poziom</Label>
                        <Select
                            value={formData.level}
                            onValueChange={(value) =>
                                setFormData({ ...formData, level: value })
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
                            value={formData.category}
                            onChange={(e) =>
                                setFormData({ ...formData, category: e.target.value })
                            }
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="edit-imageUrl">URL obrazka</Label>
                        <Input
                            id="edit-imageUrl"
                            type="url"
                            value={formData.imageUrl}
                            onChange={(e) =>
                                setFormData({ ...formData, imageUrl: e.target.value })
                            }
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Anuluj
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={loading}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Zapisz
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
